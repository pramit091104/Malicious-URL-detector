pipeline {
    agent any

    // We reference the NodeJS tool. Make sure to configure 'NodeJS' in Jenkins Global Tool Configuration.
    tools {
        nodejs 'NodeJS' 
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out code from Repository..."
                checkout scm
            }
        }

        stage('Install Dependencies & Verify') {
            steps {
                echo "Installing NPM Workspaces Dependencies..."
                // Install at root to handle both frontend and backend
                sh 'npm cache clean --force'
                sh 'npm install'
                
                echo "Verifying Backend TypeScript Types..."
                dir('backend') {
                    sh 'npx tsc --noEmit'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker Image packaging frontend and backend..."
                // This utilizes the Dockerfile in the root directory
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
                // This saves the file in Jenkins so it doesn't get deleted by cleanWs()
                archiveArtifacts artifacts: 'ai-url-detector-image.tar', followSymlinks: false
            }
        }
    }

    post {
        always {
            // Clean up the workspace to save disk space on Jenkins
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
