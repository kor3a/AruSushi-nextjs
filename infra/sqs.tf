# Order events queue + dead-letter queue.
#
# Standard queue, not FIFO: FIFO caps at 300 TPS, costs more per request, and
# its dedup window is only 5 minutes — useless for a retry that lands an hour
# later, so the consumer has to be idempotent regardless. Order confirmations
# don't need global ordering, so standard plus an idempotent consumer is the
# right shape.

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

provider "aws" {
  region = var.aws_region
}

resource "aws_sqs_queue" "order_events_dlq" {
  name = "arusushi-order-events-dlq-${var.environment}"

  # 14 days, the maximum. Worth knowing: the retention clock does NOT reset
  # when a message moves here — it keeps its original enqueue timestamp, so a
  # message that spent 3 days failing in the main queue arrives with 3 of its
  # 14 days already spent.
  message_retention_seconds = 1209600

  tags = {
    Application = "arusushi"
    Component   = "order-events-dlq"
  }
}

resource "aws_sqs_queue" "order_events" {
  name = "arusushi-order-events-${var.environment}"

  # ~6x expected processing time. An SES send is low hundreds of milliseconds;
  # 30s leaves room for a slow call without letting a crashed consumer's
  # message sit invisible for minutes before anything retries it.
  visibility_timeout_seconds = 30

  # 4 days. Anything still undelivered after that is not going to be useful to
  # a restaurant that served the order on Friday.
  message_retention_seconds = 345600

  # Long polling at the queue level as well as per-receive, so an accidental
  # short poll doesn't quietly start costing money on empty receives.
  receive_wait_time_seconds = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_events_dlq.arn
    # 5 receives, then it goes to the DLQ instead of cycling forever. A poison
    # pill — a malformed payload, an order that was rolled back — would
    # otherwise retry until the retention period ran out.
    maxReceiveCount = 5
  })

  tags = {
    Application = "arusushi"
    Component   = "order-events"
  }
}

# A healthy DLQ is empty, so any message at all is the alarm.
resource "aws_cloudwatch_metric_alarm" "dlq_not_empty" {
  alarm_name          = "arusushi-order-events-dlq-not-empty-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 1
  alarm_description   = "An order notification failed 5 times and landed in the DLQ."
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.order_events_dlq.name
  }
}

# Age, not depth. A deep queue draining fast is fine; a shallow one that's
# stuck is not, and only age catches the second case.
resource "aws_cloudwatch_metric_alarm" "queue_backing_up" {
  alarm_name          = "arusushi-order-events-backlog-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 300 # 5 minutes behind during a dinner rush is a problem
  alarm_description   = "Order notifications are lagging — worker may be down or throttled."
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.order_events.name
  }
}

output "order_events_queue_url" {
  value       = aws_sqs_queue.order_events.url
  description = "Set this as SQS_ORDER_EVENTS_QUEUE_URL in the app and worker env."
}

output "order_events_dlq_url" {
  value = aws_sqs_queue.order_events_dlq.url
}
