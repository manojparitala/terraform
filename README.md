# terraform

In this REPO we will see how to deploy AWX into AWS using Terraform.

Main.tf file will generate a key-pair to login to the instance and run the file awx.sh 

variables.tf we define the enviroment, VPC and Subnet id's

awx.sh contains the code which we deploy them in the instance we created using main.tf, we take advantage of kubernetes to deploy the yml file.
