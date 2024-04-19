resource "aws_default_vpc" "default_vpc" {}

# default public subnets
resource "aws_default_subnet" "default_subnet_a" {
  availability_zone = "${var.region}a"
}

resource "aws_default_subnet" "default_subnet_b" {
  availability_zone = "${var.region}b"
}

data "aws_subnet" "private_subnet_a" {
  id = var.private_subnet_a_id
}

data "aws_subnet" "private_subnet_b" {
  id = var.private_subnet_b_id
}
