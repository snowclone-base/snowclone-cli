Welcome to the Relay CLI! 

To start working on this project, 
- run `npm install`
- run `npm link` to establish a symlink (may need to run `sudo` here) so you can test the CLI locally

Currently, the commands available are as follows
- `relay-cli --name "my-project"` will create a new directory in the current working directory called `my-project` and copy the `relay-instance-template` into it
    - view the instance in action by navigating into `my-project` and running `docker compose up`
- running `relay-cli` without any options will copy `relay-instance-template` into the current working directory (not recommended)