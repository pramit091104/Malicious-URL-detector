pipeline {
    agent any

    options {
        timeout(time: 15, unit: 'MINUTES')
    }

    parameters {
        string(name: 'PROJECT_NAME', defaultValue: 'url-detector', description: 'Base project name for containers')
    }

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        // Create a safe branch name (lowercase, alphanumeric and hyphens only)
        SAFE_BRANCH = "${env.BRANCH_NAME ? env.BRANCH_NAME.replaceAll('[^a-zA-Z0-9-]', '-').toLowerCase() : 'local'}"
        UNIQUE_PROJECT_NAME = "${params.PROJECT_NAME}-${SAFE_BRANCH}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📥 Checking out code from GitHub (Branch: ${env.BRANCH_NAME ?: 'local'})..."
                checkout scm
            }
        }

        stage('Verify Docker') {
            steps {
                echo "🔍 Verifying Docker is accessible..."
                sh 'docker --version'
                sh 'docker-compose --version'
            }
        }

        stage('Cleanup Old Containers') {
            steps {
                echo "🧹 Stopping and removing old application containers for branch ${SAFE_BRANCH}..."
                script {
                    sh """
                        echo "PROJECT_NAME=${UNIQUE_PROJECT_NAME}" > .env
                        # Use 0 to let Docker assign random available host ports
                        echo "FRONTEND_PORT=0" >> .env
                        echo "BACKEND_PORT=0" >> .env
                        
                        docker-compose -p ${UNIQUE_PROJECT_NAME} -f docker-compose.yml down --remove-orphans || true
                        docker rm -f ${UNIQUE_PROJECT_NAME}-frontend ${UNIQUE_PROJECT_NAME}-backend || true
                        docker network prune -f || true
                    """
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo "🔨 Building Docker images for frontend and backend..."
                sh "docker-compose -p ${UNIQUE_PROJECT_NAME} -f docker-compose.yml build --no-cache"
            }
        }

        stage('Deploy Application') {
            steps {
                echo "🚀 Deploying application containers..."
                sh "docker-compose -p ${UNIQUE_PROJECT_NAME} -f docker-compose.yml up -d"
            }
        }

        stage('Verify Deployment') {
            steps {
                echo "✅ Verifying containers are running..."
                script {
                    sh "docker ps --filter name=${UNIQUE_PROJECT_NAME}-frontend --filter name=${UNIQUE_PROJECT_NAME}-backend"
                    
                    // Wait for containers to be healthy
                    sleep(time: 5, unit: 'SECONDS')
                    
                    // Check if containers are still running
                    def frontendRunning = sh(
                        script: "docker ps -q -f name=${UNIQUE_PROJECT_NAME}-frontend",
                        returnStdout: true
                    ).trim()
                    
                    def backendRunning = sh(
                        script: "docker ps -q -f name=${UNIQUE_PROJECT_NAME}-backend",
                        returnStdout: true
                    ).trim()
                    
                    if (!frontendRunning || !backendRunning) {
                        error("❌ One or more containers failed to start!")
                    }
                    
                    echo "✅ Frontend container ID: ${frontendRunning}"
                    echo "✅ Backend container ID: ${backendRunning}"
                }
            }
        }

        stage('Health Check') {
            steps {
                echo "🏥 Running health checks..."
                script {
                    // Dynamically fetch the random port assigned to the backend host
                    env.ACTUAL_BACKEND_PORT = sh(
                        script: "docker port ${UNIQUE_PROJECT_NAME}-backend 3000 | head -n 1 | awk -F ':' '{print \$NF}'",
                        returnStdout: true
                    ).trim()
                    
                    echo "Dynamic Backend Port is ${env.ACTUAL_BACKEND_PORT}"

                    sh """
                        echo "Checking backend API (waiting for AI Model to download if needed)..."
                        # Retry up to 5 times, waiting 10 seconds between retries, max time per request 60s
                        curl -f --retry 5 --retry-connrefused --retry-delay 10 --max-time 60 \\
                            http://host.docker.internal:${env.ACTUAL_BACKEND_PORT}/api/scan -X POST \\
                            -H "Content-Type: application/json" \\
                            -d '{"url":"https://google.com"}' || { echo "❌ Backend API check failed after multiple retries"; exit 1; }
                    """
                }
            }
        }
    }

    post {
        always {
            echo "🏁 CI/CD Pipeline Finished!"
            // Show container logs for debugging
            sh """
                echo "=== Frontend Logs ==="
                docker logs ${UNIQUE_PROJECT_NAME}-frontend --tail 50 || true
                echo "=== Backend Logs ==="
                docker logs ${UNIQUE_PROJECT_NAME}-backend --tail 50 || true
            """
        }
        success {
            script {
                // Dynamically fetch the random port assigned to the frontend
                env.ACTUAL_FRONTEND_PORT = sh(
                    script: "docker port ${UNIQUE_PROJECT_NAME}-frontend 80 | awk -F ':' '{print \$NF}'",
                    returnStdout: true
                ).trim()
                
                echo """
                ✅ Deployment Successful for branch ${env.BRANCH_NAME ?: 'local'}!
                
                🌐 Frontend Preview: http://localhost:${env.ACTUAL_FRONTEND_PORT}
                🔌 Backend API: http://localhost:${env.ACTUAL_BACKEND_PORT}
                
                Run 'docker ps | grep ${UNIQUE_PROJECT_NAME}' to see the running containers for this branch.
                """
            }
        }
        failure {
            echo """
            ❌ Deployment Failed for branch ${env.BRANCH_NAME ?: 'local'}!
            
            Check the logs above for errors.
            Run 'docker logs ${UNIQUE_PROJECT_NAME}-frontend' or 'docker logs ${UNIQUE_PROJECT_NAME}-backend' for details.
            """
        }
    }
}
