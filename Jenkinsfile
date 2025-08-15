pipeline {
    agent any

    environment {
        DOCKER_HUB_USER       = "kalana1234"  // Replace with your Docker Hub username
        DOCKER_CREDENTIALS    = "test-jenkins"        // Jenkins credentials ID for Docker Hub
        BACKEND_IMAGE_NAME    = "backend_container"
        FRONTEND_IMAGE_NAME   = "frontend_container"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/kalana-karunarathna/test-3.git' // Replace with your repo
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    dir('backend') {
                        backendImage = docker.build(
                            "${DOCKER_HUB_USER}/${BACKEND_IMAGE_NAME}:${BUILD_NUMBER}"
                        )
                    }
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    dir('frontend') {
                        frontendImage = docker.build(
                            "${DOCKER_HUB_USER}/${FRONTEND_IMAGE_NAME}:${BUILD_NUMBER}"
                        )
                    }
                }
            }
        }

        stage('Push Backend Image to Docker Hub') {
            steps {
                script {
                    docker.withRegistry('', DOCKER_CREDENTIALS) {
                        backendImage.push("${BUILD_NUMBER}")
                        backendImage.push('latest')
                    }
                }
            }
        }

        stage('Push Frontend Image to Docker Hub') {
            steps {
                script {
                    docker.withRegistry('', DOCKER_CREDENTIALS) {
                        frontendImage.push("${BUILD_NUMBER}")
                        frontendImage.push('latest')
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully. Images pushed to Docker Hub."
        }
        failure {
            echo "❌ Pipeline failed. Check the build logs."
        }
    }
}
