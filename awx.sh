#!/bin/bash

# Update and upgrade your system
sudo apt update && sudo apt -y upgrade

# install K3s on our Ubuntu system
curl -sfL https://get.k3s.io | sudo bash -

# Validate K3s installation
kubectl get nodes

# confirm Kubernetes version deployed
# kubectl version --short

# Deploy AWX Operator on Kubernetes
kubectl apply -f https://raw.githubusercontent.com/ansible/awx-operator/devel/deploy/awx-operator.yaml

# Wait few minutes and awx-operator should be running
kubectl get pods

# Install Ansible AWX on Ubuntu
# Create Static data PVC

cat <<EOF | kubectl create -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: static-data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 1Gi
EOF

# create AWX deployment file
cat <<EOF > awx-deploy.yml
---
apiVersion: awx.ansible.com/v1beta1
kind: AWX
metadata:
  name: awx
spec:
  service_type: nodeport
  projects_persistence: true
  projects_storage_access_mode: ReadWriteOnce
  web_extra_volume_mounts: |
    - name: static-data
      mountPath: /var/lib/awx/public
  extra_volumes: |
    - name: static-data
      persistentVolumeClaim:
        claimName: static-data-pvc
EOF

# Apply configuration manifest file
kubectl apply -f awx-deploy.yml

# Wait a few minutes then check AWX instance deployed
kubectl get pods -l "app.kubernetes.io/managed-by=awx-operator"

# to check deployment logs
kubectl logs -f deployments/awx-operator

# List all available services and check awx-service Nodeport
kubectl get svc -l "app.kubernetes.io/managed-by=awx-operator"

# Ansible AWX web portal is now accessible on http://hostip_or_hostname:<awx-service:PORT>

# The login username is admin
# Obtain admin user password by decoding the secret with the password valu
kubectl get secret awx-admin-password -o go-template='{{range $k,$v := .data}}{{printf "%s: " $k}}{{if not $v}}{{$v}}{{else}}{{$v | base64decode}}{{end}}{{"\n"}}{{end}}'
