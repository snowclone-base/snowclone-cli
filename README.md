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

- clone this repository
- run `npm install`
- run `npm link` to establish a symlink (may need to run `sudo`)

## Usage

### `snowclone init`

Initialize your AWS with the necessary admin infrastructure. </br></br>
Prompts:

- AWS region

### `snowclone deploy`

Deploy a new backend stack to ECS Fargate. </br></br>
Prompts:

- Project name
- AWS region

### `snowclone import`

Import a schema file to a backend. </br></br>
Prompts:

- Project name
- File path

### `snowclone list`

List all active projects.
