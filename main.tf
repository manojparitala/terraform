/*
resource "aws_key_pair" "ubuntu" {
  key_name   = "awx"
  public_key = "${file(var.public_key_path)}"
}
*/

resource "tls_private_key" "pk" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "ubuntu" {
  key_name   = "myKey"       # Create "myKey" to AWS!!
  public_key = tls_private_key.pk.public_key_openssh

  provisioner "local-exec" { # Create "myKey.pem" to your computer!!
    command = "echo '${tls_private_key.pk.private_key_pem}' > ./myKey.pem"
  }
}

// preperation Work on server scripts
data "template_file" "prep-work" {
  template = "${file("modules/files/awx.sh")}"
}

resource "aws_security_group" "ubuntu" {
  name        = "ubuntu-security-group"
  description = "Allow HTTP, HTTPS and SSH traffic"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "AWX-terraform"
  }
}


resource "aws_instance" "ubuntu" {
  key_name      = "${aws_key_pair.ubuntu.key_name}"
  ami           = "<IMAGE-ID>"
  instance_type = "<INSTANCE-TYPE>"
  subnet_id     = "${var.subnet_id}"
  user_data     = "${data.template_file.prep-work.rendered}"

  tags = {
    Name = "ubuntu"
  }

  vpc_security_group_ids = [
    "${aws_security_group.ubuntu.id}"
  ]

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = file("awx")
    host        = self.public_ip
  }

  ebs_block_device {
    device_name = "/dev/sda1"
    volume_type = "gp3"
    volume_size = 30
  }
}

resource "aws_eip" "ubuntu" {
  vpc      = true
  instance = aws_instance.ubuntu.id
}
