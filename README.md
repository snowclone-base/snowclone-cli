# Snowclone CLI

## Prerequisites

- Have [Terraform](https://developer.hashicorp.com/terraform/install) installed
- Set your AWS credentials as environment variables from a terminal:

```
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

## Installation

To install the Snowclone CLI:

- Clone this repository
- Run `npm install`
- Run `npm link` to establish a symlink (may need to run `sudo`)

## Usage

### `snowclone init`

Initialize your AWS with the necessary admin infrastructure. </br>

```
FLAGS
  -r, --region: The AWS region

EXAMPLE
  snowclone init -r us-west-1
```

### `snowclone deploy`

Deploy a new backend stack to ECS Fargate. </br>

```
FLAGS
  -n, --name: The name of the project
  -r, --region: The AWS region

EXAMPLE
  snowclone deploy -n snowcones -r us-west-1
```

### `snowclone import`

Import a sql file to a backend. </br>

```
FLAGS
  -n, --name: The name of the project to upload a sql file to
  -f, --filepath: The path of the sql file

EXAMPLE
  snowclone import -n snowcones -f snowconesSchema.sql
```

### `snowclone list`

List all active projects.

### `snowclone remove`

Remove a specified project.

```
FLAGS
  -n, --name: The name of the project backend to be removed

EXAMPLE
  snowclone remove -n snowcones
```

### `snowclone melt`

Remove data for all active projects and tear down admin infrastructure from AWS.
