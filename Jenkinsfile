pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out code from Repository..."
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker Image packaging frontend and backend..."
                // Since npm was failling inside your generic Jenkins container,
                // we've moved all the dependencies and verification into the Docker build process!
                sh 'docker build -t ai-url-detector:latest .'
            }
        }

        stage('Export Docker Image (.tar)') {
            steps {
                echo "Exporting Docker Image to .tar file..."
                sh 'docker save -o ai-url-detector-image.tar ai-url-detector:latest'
            }
        }

        stage('Archive Artifact') {
            steps {
                echo "Archiving .tar file so users can download it from Jenkins UI..."
                archiveArtifacts artifacts: 'ai-url-detector-image.tar', followSymlinks: false
            }
        }
    }

    post {
        always {
            cleanWs()
            echo "CI/CD Pipeline Finished!"
        }
        success {
            echo "Build was successful! ✅"
        }
        failure {
            echo "Build failed! ❌ Check the Jenkins logs."
        }
    }
}
