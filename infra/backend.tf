# Shared state in S3 so every machine sees the same infrastructure.
#
# With local state, a second computer has no record of what already exists and
# tries to create it all again: SQS happily hands back the existing queues, but
# IAM fails on the duplicate role and API Gateway creates a second, orphaned
# REST API. Keeping state in one bucket avoids that.
#
# The bucket is passed at init time so the account-specific name stays out of
# the repo:
#
#   terraform init -backend-config="bucket=<your-state-bucket>"
#
# use_lockfile needs Terraform >= 1.10 and stops two machines applying at once.
terraform {
  required_version = ">= 1.10"

  backend "s3" {
    key          = "arusushi/infra.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
