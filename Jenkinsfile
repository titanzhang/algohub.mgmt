node('NodeRaw') {

  try {
    stage ('Clone Source') {
        checkout scm
    }

    stage('Production Config') {
      configFileProvider([configFile(fileId: 'algohub_mgmt_api_production', variable: 'CONFIG_API')]) {
        sh "cp \"${CONFIG_API}\" src/config/api.js"
      }
      configFileProvider([configFile(fileId: 'algohub_mgmt_github_production', variable: 'CONFIG_GITHUB')]) {
        sh "cp \"${CONFIG_GITHUB}\" src/config/github.js"
      }
      configFileProvider([configFile(fileId: 'algohub_mgmt_server_production', variable: 'CONFIG_SERVER')]) {
        sh "cp \"${CONFIG_SERVER}\" src/config/server.js"
      }
      configFileProvider([configFile(fileId: 'algohub_mgmt_site_production', variable: 'CONFIG_SITE')]) {
        sh "cp \"${CONFIG_SITE}\" src/config/site.js"
      }
    }

    stage('Compile') {
      def NODE_VERSION = '7.8'
      docker.image("node:${NODE_VERSION}").inside {
        sh 'cd src && npm install --production'
      }
    }

    stage('Build Docker image') {
      sh 'cp Dockerfile src/'
      dir('src') {
        def newImage = docker.build("algohub-mgmt")
        docker.withRegistry("https://239150759114.dkr.ecr.us-west-1.amazonaws.com", "ecr:us-west-1:aws-ecr-cred") {
          newImage.push("${env.BUILD_ID}")
          newImage.push("latest")
        }
      }
    }

  } finally {
    stage('Cleanup') {
      cleanWs notFailBuild: true
    }
  }

}
