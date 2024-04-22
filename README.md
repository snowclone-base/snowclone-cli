# Snowclone CLI

## Before using Snowclone CLI, you must do the following:

- Install [Terraform](https://developer.hashicorp.com/terraform/install)
- Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Set [AWS credentials as environment variables from the terminal](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html)
- Register a domain AWS route-53.


## Installation

To install the Snowclone CLI, run the following command in the terminal: </br>
`npm install -g snowclone-cli`

## Usage

### `snowclone init`

Initialize your AWS with the necessary admin infrastructure. </br>

```
FLAGS
  -r, --region: The AWS region
  -d, --domain: Your route-53 registered domain

EXAMPLE
  snowclone init -r us-west-1 -d myapp.com
```
Snowclone will prompt users for these values if flags are not present. 

### `snowclone deploy`

Deploy a new backend stack to ECS Fargate. </br>

```
FLAGS
  -n, --name: The name of the project

EXAMPLE
  snowclone deploy -n snowcones
```
Snowclone will prompt users for a project name if the flag is not present. 

### `snowclone import`

Import a specified sql file to a specified backend. </br>

```
FLAGS
  -n, --name: The name of the project to upload a sql file to
  -f, --filepath: The path of the sql file

EXAMPLE
  snowclone import -n snowcones -f snowconesSchema.sql
```
Snowclone will prompt users for a project name if the flag is not present. 

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
Snowclone will prompt users for a project name if the flag is not present. 

### `snowclone melt`
Remove the admin infrastructure that was created with `snowclone init`. Note: this operation is irreversable. You will be prompted for confirmation before 'melt' proceeds. This action should only be done if all projects have been removed.

