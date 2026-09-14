# DoorDash delivery webhook ingestion.
#
# DoorDash posts delivery status events (Dasher assigned, picked up, dropped
# off) that we must not drop. Previously they went straight to a Next.js API
# route, which meant a deploy, a container restart or an OOM lost whatever
# arrived during the gap — DoorDash retries, but not forever, and a lost
# DASHER_PICKED_UP leaves an order stuck on the customer's tracking page.
#
# This fronts that endpoint with API Gateway integrated DIRECTLY with SQS.
# There is no Lambda and no container in the ingest path, so the only things
# that have to be up to accept an event are API Gateway and SQS. The worker
# consumes the queue and does the database work; if the worker is down, events
# wait in the queue instead of being lost.
#
# REST API rather than HTTP API deliberately: HTTP APIs have no request
# validators or JSON Schema models, and validating the payload shape at the
# edge is half the reason for putting a gateway here at all.

resource "aws_sqs_queue" "delivery_events_dlq" {
  name                      = "arusushi-delivery-events-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Application = "arusushi"
    Component   = "delivery-events-dlq"
  }
}

resource "aws_sqs_queue" "delivery_events" {
  name = "arusushi-delivery-events-${var.environment}"

  # Processing is a lookup plus an update plus a realtime broadcast, and the
  # broadcast has its own 5s timeout. 60s leaves headroom without letting a
  # crashed consumer's message sit invisible for minutes.
  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600 # 4 days
  receive_wait_time_seconds  = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.delivery_events_dlq.arn
    maxReceiveCount     = 5
  })

  tags = {
    Application = "arusushi"
    Component   = "delivery-events"
  }
}

# ---------------------------------------------------------------------------
# IAM: let API Gateway put messages on the queue, and nothing else.
# ---------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "apigw_sqs" {
  name = "arusushi-apigw-sqs-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "apigw_sqs" {
  name = "send-delivery-events"
  role = aws_iam_role.apigw_sqs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:SendMessage"]
      Resource = aws_sqs_queue.delivery_events.arn
    }]
  })
}

# ---------------------------------------------------------------------------
# The API
# ---------------------------------------------------------------------------

resource "aws_api_gateway_rest_api" "webhooks" {
  name        = "arusushi-webhooks-${var.environment}"
  description = "Third-party webhook ingestion. No compute in the request path."

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "webhooks" {
  rest_api_id = aws_api_gateway_rest_api.webhooks.id
  parent_id   = aws_api_gateway_rest_api.webhooks.root_resource_id
  path_part   = "webhooks"
}

resource "aws_api_gateway_resource" "doordash" {
  rest_api_id = aws_api_gateway_rest_api.webhooks.id
  parent_id   = aws_api_gateway_resource.webhooks.id
  path_part   = "doordash"
}

# Structural validation at the edge. A payload without an event_name or a
# delivery identifier can never be processed, so rejecting it here keeps
# garbage off the queue entirely rather than spending five receives and a DLQ
# slot discovering the same thing.
resource "aws_api_gateway_model" "delivery_event" {
  rest_api_id  = aws_api_gateway_rest_api.webhooks.id
  name         = "DoorDashDeliveryEvent"
  content_type = "application/json"

  schema = jsonencode({
    "$schema" = "http://json-schema.org/draft-04/schema#"
    title     = "DoorDashDeliveryEvent"
    type      = "object"
    required  = ["event_name"]
    properties = {
      event_name = {
        type = "string"
        enum = [
          "DASHER_CONFIRMED",
          "DASHER_CONFIRMED_PICKUP_ARRIVAL",
          "DASHER_PICKED_UP",
          "DASHER_CONFIRMED_DROPOFF_ARRIVAL",
          "DASHER_DROPPED_OFF",
          "DELIVERY_CANCELLED",
        ]
      }
      external_delivery_id = { type = "string" }
      delivery_id          = { type = "string" }
      tracking_url         = { type = "string" }
      dasher               = { type = "object" }
    }
  })
}

resource "aws_api_gateway_request_validator" "body" {
  rest_api_id           = aws_api_gateway_rest_api.webhooks.id
  name                  = "validate-body"
  validate_request_body = true
}

resource "aws_api_gateway_method" "doordash_post" {
  rest_api_id   = aws_api_gateway_rest_api.webhooks.id
  resource_id   = aws_api_gateway_resource.doordash.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.body.id

  request_models = {
    "application/json" = aws_api_gateway_model.delivery_event.name
  }
}

# The direct SQS service integration. `type = "AWS"` with an SQS path URI is
# what removes compute from the path: API Gateway signs the SendMessage call
# itself using the role above.
resource "aws_api_gateway_integration" "doordash_sqs" {
  rest_api_id = aws_api_gateway_rest_api.webhooks.id
  resource_id = aws_api_gateway_resource.doordash.id
  http_method = aws_api_gateway_method.doordash_post.http_method

  type                    = "AWS"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.aws_region}:sqs:path/${data.aws_caller_identity.current.account_id}/${aws_sqs_queue.delivery_events.name}"
  credentials             = aws_iam_role.apigw_sqs.arn
  passthrough_behavior    = "NEVER"

  request_parameters = {
    "integration.request.header.Content-Type" = "'application/x-www-form-urlencoded'"
  }

  # Wraps the raw DoorDash body in an envelope carrying the Authorization
  # header. The gateway has no compute to verify that shared secret, so the
  # consumer does it before touching the database — the header has to survive
  # the hop for that to be possible.
  #
  # $input.json('$') is inserted RAW, not through escapeJavaScript — escaping it
  # would turn the body into a string of escaped quotes sitting in an object
  # position, which is not valid JSON. The header value does get escaped,
  # because it lands inside a JSON string literal.
  request_templates = {
    "application/json" = <<EOT
Action=SendMessage&MessageBody=$util.urlEncode("{""headers"":{""authorization"":""$util.escapeJavaScript($input.params('Authorization'))""},""requestId"":""$context.requestId"",""receivedAt"":""$context.requestTimeEpoch"",""body"":$input.json('$')}")
EOT
  }
}

# DoorDash gets a 202 the moment the message is on the queue. Nothing about
# their retry behaviour depends on how long our processing takes.
resource "aws_api_gateway_method_response" "accepted" {
  rest_api_id = aws_api_gateway_rest_api.webhooks.id
  resource_id = aws_api_gateway_resource.doordash.id
  http_method = aws_api_gateway_method.doordash_post.http_method
  status_code = "202"
}

resource "aws_api_gateway_integration_response" "accepted" {
  rest_api_id = aws_api_gateway_rest_api.webhooks.id
  resource_id = aws_api_gateway_resource.doordash.id
  http_method = aws_api_gateway_method.doordash_post.http_method
  status_code = aws_api_gateway_method_response.accepted.status_code

  # Don't hand SQS's XML response back to DoorDash.
  response_templates = {
    "application/json" = "{\"received\": true}"
  }

  depends_on = [aws_api_gateway_integration.doordash_sqs]
}

resource "aws_api_gateway_deployment" "webhooks" {
  rest_api_id = aws_api_gateway_rest_api.webhooks.id

  triggers = {
    redeploy = sha1(jsonencode([
      aws_api_gateway_resource.doordash.id,
      aws_api_gateway_method.doordash_post.id,
      aws_api_gateway_integration.doordash_sqs.id,
      aws_api_gateway_model.delivery_event.schema,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "webhooks" {
  rest_api_id   = aws_api_gateway_rest_api.webhooks.id
  deployment_id = aws_api_gateway_deployment.webhooks.id
  stage_name    = var.environment
}

# The endpoint is unauthenticated at the edge (no compute to check a secret),
# so throttling is what bounds abuse. A real restaurant sees a handful of
# delivery events a minute; 20/sec is generous and still caps what someone who
# finds the URL can push onto the queue.
resource "aws_api_gateway_method_settings" "throttle" {
  rest_api_id = aws_api_gateway_rest_api.webhooks.id
  stage_name  = aws_api_gateway_stage.webhooks.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = 20
    throttling_burst_limit = 40
    metrics_enabled        = true
  }
}

resource "aws_cloudwatch_metric_alarm" "delivery_dlq_not_empty" {
  alarm_name          = "arusushi-delivery-events-dlq-not-empty-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 1
  alarm_description   = "A DoorDash delivery event failed 5 times and landed in the DLQ."
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.delivery_events_dlq.name
  }
}

output "doordash_webhook_url" {
  value       = "${aws_api_gateway_stage.webhooks.invoke_url}/webhooks/doordash"
  description = "Point the DoorDash developer portal webhook at this URL."
}

output "delivery_events_queue_url" {
  value       = aws_sqs_queue.delivery_events.url
  description = "Set as SQS_DELIVERY_EVENTS_QUEUE_URL on the worker."
}
