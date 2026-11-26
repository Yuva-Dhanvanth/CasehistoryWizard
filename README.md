# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

docker run -d --name nagiosdemo -p 127.0.0.1:8888:80 jasonrivers/nagios:latest




services:
  fastapi:
    build: .
    container_name: fastapi
    ports:
      - "5000:5000"
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    container_name: postgres
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
      POSTGRES_DB: testdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:






FROM python:3.11

WORKDIR /app

RUN pip install fastapi uvicorn psycopg2-binary

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]













FROM maven:3.9-eclipse-temurin-17

WORKDIR /app

COPY . /app

RUN mvn clean package

CMD ["java", "-jar", "target/app.jar"]









FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY . /app

RUN mvn clean package

FROM tomcat:10.1-jdk17

WORKDIR /usr/local/tomcat/webapps

COPY --from=build /app/target/*.war ROOT.war

EXPOSE 8080

CMD ["catalina.sh", "run"]






pipeline {
    agent any

    tools {
        maven 'MAVEN_HOME'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/krishna2026-stack/MavenJava.git'
            }
        }

        stage('Clean') {
            steps {
                dir('MavenJavaDemo-main') {
                    bat 'mvn clean'
                }
            }
        }

        stage('Compile') {
            steps {
                dir('MavenJavaDemo-main') {
                    bat 'mvn compile'
                }
            }
        }

        stage('Test') {
            steps {
                dir('MavenJavaDemo-main') {
                    bat 'mvn test'
                }
            }
        }

        stage('Package') {
            steps {
                dir('MavenJavaDemo-main') {
                    bat 'mvn package'
                }
            }
        }
    }

    post {
        success {
            echo 'Maven build completed successfully!'
        }

        failure {
            echo 'Maven build failed!'
        }

        always {
            archiveArtifacts artifacts: 'MavenJavaDemo-main/target/*.jar',
                             allowEmptyArchive: true
        }
    }
}







To check version of minikube : minikube version
To start minikube : minikube start --driver=docker
To check status : minikube start
To get nodes of minikube : kubectl get nodes
To create deployment : kubectl create deployment mynginx --image=nginx
To get deployments : kubectl get deployments
To get pods : kubectl get pods
To expose our server so we can use it : kubectl expose deployment mynginx --type=NodePort --port=80 --target-port=80
To get services : kubectl get services
To run it : minikube service mynginx --url
To delete deployment : kubectl delete service mynginx
To stop minikube : minikube stop

minikube image load docker.io/library/nginx:latest

docker tag nginx:latest YOUR_USERNAME/mynginx:latest

docker push YOUR_USERNAME/mynginx:latest
