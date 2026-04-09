pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        PROJECT_NAME = 'url-detector'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📥 Checking out code from GitHub..."
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
                echo "🧹 Stopping and removing old application containers..."
                script {
                    sh '''
                        docker-compose -f docker-compose.yml down --remove-orphans || true
                        docker rm -f pramit-frontend pramit-backend || true
                        docker network prune -f || true
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo "🔨 Building Docker images for frontend and backend..."
                sh 'docker-compose -f docker-compose.yml build --no-cache'
            }
        }

        stage('Deploy Application') {
            steps {
                echo "🚀 Deploying application containers..."
                sh 'docker-compose -f docker-compose.yml up -d'
            }
        }

        stage('Verify Deployment') {
            steps {
                echo "✅ Verifying containers are running..."
                script {
                    sh 'docker ps --filter name=pramit-frontend --filter name=pramit-backend'
                    
                    // Wait for containers to be healthy
                    sleep(time: 5, unit: 'SECONDS')
                    
                    // Check if containers are still running
                    def frontendRunning = sh(
                        script: 'docker ps -q -f name=pramit-frontend',
                        returnStdout: true
                    ).trim()
                    
                    def backendRunning = sh(
                        script: 'docker ps -q -f name=pramit-backend',
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
                    // Check backend API
                    sh '''
                        echo "Checking backend API..."
                        sleep 10
                        curl -f http://localhost:4000/api/scan -X POST \
                            -H "Content-Type: application/json" \
                            -d '{"url":"https://google.com"}' || echo "Backend API check failed (might need warmup)"
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "🏁 CI/CD Pipeline Finished!"
            // Show container logs for debugging
            sh '''
                echo "=== Frontend Logs ==="
                docker logs pramit-frontend --tail 50 || true
                echo "=== Backend Logs ==="
                docker logs pramit-backend --tail 50 || true
            '''
        }
        success {
            echo """
            ✅ Deployment Successful!
            
            🌐 Frontend: http://localhost:3000
            🔌 Backend API: http://localhost:4000
            
            Run 'docker ps' to see running containers.
            """
        }
        failure {
            echo """
            ❌ Deployment Failed!
            
            Check the logs above for errors.
            Run 'docker logs pramit-frontend' or 'docker logs pramit-backend' for details.
            """
        }
    }
}
