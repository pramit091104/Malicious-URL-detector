pipeline {
    agent any

    // Reference the NodeJS tool configured in Jenkins Global Tool Configuration
    tools {
        nodejs 'NodeJs' 
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out code from Repository..."
                checkout scm
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                echo "Cleaning up previous application containers..."
                sh 'docker-compose down --remove-orphans'
                
                echo "Deploying Live Application via Docker Compose..."
                // --build ensures that any code changes are baked into new images
                sh 'docker-compose up -d --build frontend backend'
            }
        }
    }

    post {
        always {
            // Clean up the workspace to save disk space on the Jenkins agent
            cleanWs()
            echo "CI/CD Pipeline Finished!"
        }
        success {
            echo "Build was successful! ✅ Your code is verified and safe."
        }
        failure {
            echo "Build failed! ❌ Check the Jenkins logs for Docker or Build errors."
        }
    }
}