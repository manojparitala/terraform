variable "aws_profile" {
  description = "AWS Profile"
  type        = string
  default     = "<ENV>"
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  type        = string
  default     = "<VPC-ID>"
}

variable "subnet_id" {
  type        = string
  default     = "<SUBNET-ID>"
}
