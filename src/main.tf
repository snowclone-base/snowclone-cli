terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "desired_region" {
  type = string
}

variable "project_name" {
  type = string
}

# Configure the AWS Provider
provider "aws" {
  region = var.desired_region
}

# Provide a reference to your default VPC
resource "aws_default_vpc" "default_vpc" {
}

# Provide references to your default subnets
resource "aws_default_subnet" "default_subnet_a" {
  # Use your own region here but reference to subnet 1a
  availability_zone = "us-east-1a"
}

resource "aws_default_subnet" "default_subnet_b" {
  # Use your own region here but reference to subnet 1b
  availability_zone = "us-east-1b"
}

# Create a Cluster
resource "aws_ecs_cluster" "my_cluster" {
  name = var.project_name
}

# Create a security group for the load balancer:
resource "aws_security_group" "load_balancer_security_group" {
  name        = "lb_sg"
  description = "testing out vpc_security_group_ingress_rule in tf "
  vpc_id      = "${aws_default_vpc.default_vpc.id}"
  tags = {
    Name = "example"
  }
}

# Ingress rule for HTTP all the way to psql calls
resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.load_balancer_security_group.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 80
  ip_protocol = "tcp"
  to_port     = 5432
}


# Egress rule
resource "aws_vpc_security_group_egress_rule" "open" {
  security_group_id = aws_security_group.load_balancer_security_group.id

  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = -1
}


# Create a load balancer 
resource "aws_alb" "network_load_balancer" {
  name               = "load-balancer-snowclone" #load balancer name
  load_balancer_type = "network"
  subnets = [ # Referencing the default subnets
    "${aws_default_subnet.default_subnet_a.id}",
    "${aws_default_subnet.default_subnet_b.id}"
  ]
  # security group
  security_groups = ["${aws_security_group.load_balancer_security_group.id}"]
}


# Configure Load Balancer with VPC networking
resource "aws_lb_target_group" "postgREST" {
  name        = "postgREST-target-group"
  port        = 3000
  protocol    = "TCP"
  target_type = "ip"
  vpc_id      = "${aws_default_vpc.default_vpc.id}" # default VPC
}


# db Target group
resource "aws_lb_target_group" "db" {
  name        = "db-target-group"
  port        = 5432
  protocol    = "TCP"
  target_type = "ip"
  vpc_id      = "${aws_default_vpc.default_vpc.id}" # default VPC
}


# HTTP Listener
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = "${aws_alb.network_load_balancer.arn}" #  load balancer
  port              = "80"
  protocol          = "TCP"
  default_action {
    type             = "forward"
    target_group_arn = "${aws_lb_target_group.postgREST.arn}" # target group
  }
}


# Direct db TCP Listener
resource "aws_lb_listener" "db_tcp" {
  load_balancer_arn = "${aws_alb.network_load_balancer.arn}"
  port              = "5432"
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.db.arn
  }
}


# Only allow traffic to containers from load balancer
resource "aws_security_group" "service_security_group" {
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    # Only allowing traffic in from the load balancer security group
    security_groups = ["${aws_security_group.load_balancer_security_group.id}"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


## Create a Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "snowcloneApps" # Name your task
  container_definitions    = <<DEFINITION
  [
    {
      "name": "postgresDB",
      "image": "postgres",
      "essential": true,
      "environment": [
        {"name": "POSTGRES_PASSWORD", "value": "postgres"},
        {"name": "POSTGRES_USER", "value": "postgres"},
        {"name": "POSTGRES_DB", "value" : "postgres"}
      ],
      "healthcheck": {
        "command": ["CMD-SHELL", "pg_isready -U postgres"],
        "interval": 5,
        "timeout": 5,
        "retries": 5
      },
      "portMappings": [
        {
          "containerPort": 5432
        }
      ],
      "memory": 512,
      "cpu": 256
    },
    {
      "name": "postgREST",
      "image": "postgrest/postgrest:latest",
      "essential": true,
      "environment": [
        {"name": "PGRST_DB_URI", "value": "postgres://authenticator:mysecretpassword@localhost:5432/postgres"},
        {"name": "PGRST_DB_SCHEMA", "value": "api"},
        {"name": "PGRST_DB_ANON_ROLE", "value" : "web_anon"},
        {"name": "PGRST_OPENAPI_SERVER_PROXY_URI", "value" : "http://localhost:3000"},
        {"name": "PGRST_JWT_SECRET", "value" : "O9fGlY0rDdDyW1SdCTaoqLmgQ2zZeCz6"}
      ],
      "dependsOn": [
        {
          "containerName": "postgresDB",
          "condition": "HEALTHY"
        }
      ],
      "portMappings": [
        {
          "containerPort": 3000
        }
      ],
      "memory": 512,
      "cpu": 256
    }
  ]
  DEFINITION
  requires_compatibilities = ["FARGATE"] # use Fargate as the launch type
  network_mode             = "awsvpc"    # add the AWS VPN network mode as this is required for Fargate
  memory                   = 1024         # Specify the memory the container requires
  cpu                      = 512         # Specify the CPU the container requires
  # didn't need below bc my IAM user already had perms
  # execution_role_arn       = "${aws_iam_role.ecsTaskExecutionRole.arn}"
}



# Create an ECS Service:


resource "aws_ecs_service" "snowCloneService" {
  name            = "snowClone"     # Name the service
  cluster         = "${aws_ecs_cluster.my_cluster.id}"   # Reference the created Cluster
  task_definition = "${aws_ecs_task_definition.app.arn}" # Reference the task that the service will spin up
  launch_type     = "FARGATE"
  desired_count   = 1 # Set up the number of containers to 1

  #postgREST
  load_balancer {
    target_group_arn = "${aws_lb_target_group.postgREST.arn}" # Reference the target group
    container_name   = "postgREST" #"${aws_ecs_task_definition.app.family}"
    container_port   = 3000 # Specify the container port
  }

  #db
  load_balancer {
    target_group_arn = "${aws_lb_target_group.db.arn}" # Reference the target group
    container_name   = "postgresDB" #"${aws_ecs_task_definition.app.family}"
    container_port   = 5432 # Specify the container port
  }
  

  network_configuration {
    subnets          = ["${aws_default_subnet.default_subnet_a.id}", "${aws_default_subnet.default_subnet_b.id}"]
    assign_public_ip = true     # Provide the containers with public IPs
    security_groups  = ["${aws_security_group.service_security_group.id}"] # Set up the security group
  }
}

#Log the load balancer app URL
output "app_url" {
  value = aws_alb.network_load_balancer.dns_name
}