#!/bin/bash

CONTAINER_NAME="cass2"
CONTAINER_PORT="9998"
CASSANDRA_DB_HOST_VOLUME="/home/kotov/test1"
CASSANDRA_DOCKER_IMAGE_TAG="latest"
CQLSH_LOGIN="cqlsh -u cassandra -p cassandra"

docker stop ${CONTAINER_NAME} 2>/dev/null && docker rm ${CONTAINER_NAME} 2>/dev/null && sudo rm -rf ${CASSANDRA_DB_HOST_VOLUME}

### BEGIN USERS ###
CREATE_USER_ADMIN_ROLE_NO_LOGIN="CREATE ROLE user_admin;"
CREATE_USERS_KEYSPACE="
CREATE KEYSPACE users
  WITH REPLICATION = { 
   'class' : 'SimpleStrategy', 
   'replication_factor' : 1 
};"
CREATE_USERS_TABLE="CREATE TABLE users.app_users ( 
   email text PRIMARY KEY,
   password text,
   firstname text,
   lastname text);"
GRANT_MODIFY_APP_USERS_PERMISSIONS_TO_USER_ADMIN="GRANT MODIFY ON users.app_users TO user_admin;"
GRANT_SELECT_APP_USERS_PERMISSIONS_TO_USER_ADMIN="GRANT SELECT ON users.app_users TO user_admin;"
USER_ADMIN_NAME="app_user_admin"
USER_ADMIN_PASSWORD="app_user_admin"
CREATE_APPLICATION_USER_ADMIN_WITH_LOGIN="CREATE ROLE ${USER_ADMIN_NAME} 
WITH PASSWORD = '${USER_ADMIN_PASSWORD}' AND LOGIN = true;"
GRANT_PERMISSIONS_TO_APPLICATION_USER_ADMIN="GRANT user_admin TO ${USER_ADMIN_NAME};"
### END USERS   ###

### BEGIN USER CONTENT ###
CREATE_USER_CONTENT_ADMIN_ROLE_NO_LOGIN="CREATE ROLE content_admin;"
CREATE_USER_CONTENT_KEYSPACE="CREATE KEYSPACE user_content
  WITH REPLICATION = { 
   'class' : 'SimpleStrategy', 
   'replication_factor' : 1 
};"
CREATE_IMAGE_TABLE="CREATE TABLE user_content.images (
    useruuid uuid,
    id uuid,
    content blob,
    tags set<text>,
    PRIMARY KEY (useruuid, id)
) WITH CLUSTERING ORDER BY (id ASC);"
CREATE_SAVED_SEARCHES_TABLE="CREATE TABLE user_content.saved_searches (
    imageuuid uuid PRIMARY KEY,
    id uuid,
    olxalt text,
    olxhref text,
    olxprice text,
    olxsrc text);"
GRANT_MODIFY_IMAGES_PERMISSIONS_TO_CONTENT_ADMIN="GRANT MODIFY ON user_content.images TO content_admin;"
GRANT_SELECT_IMAGES_PERMISSIONS_TO_CONTENT_ADMIN="GRANT SELECT ON user_content.images TO content_admin;"
GRANT_MODIFY_SAVED_SEARCHES_PERMISSIONS_TO_CONTENT_ADMIN="GRANT MODIFY ON user_content.saved_searches TO content_admin;"
GRANT_SELECT_SAVED_SEARCHES_PERMISSIONS_TO_CONTENT_ADMIN="GRANT SELECT ON user_content.saved_searches TO content_admin;"
USER_CONTENT_ADMIN_NAME="app_user_content_admin"
USER_CONTET_ADMIN_PASSWORD="app_user_content_admin"
CREATE_APPLICATION_CONTENT_USER_ADMIN_WITH_LOGIN="CREATE ROLE ${USER_CONTENT_ADMIN_NAME} 
    WITH PASSWORD = '${USER_CONTET_ADMIN_PASSWORD}' AND LOGIN = true;"
GRANT_PRIVILEGE_APPLICATION_CONTENT_USER_ADMIN="GRANT content_admin TO ${USER_CONTENT_ADMIN_NAME};"
### END USER CONTENT   ###

declare -a QUERIES=( "${CREATE_USER_ADMIN_ROLE_NO_LOGIN}"
"${CREATE_USERS_KEYSPACE}"
"${CREATE_USERS_TABLE}"
"${GRANT_MODIFY_APP_USERS_PERMISSIONS_TO_USER_ADMIN}"
"${GRANT_SELECT_APP_USERS_PERMISSIONS_TO_USER_ADMIN}"
"${CREATE_APPLICATION_USER_ADMIN_WITH_LOGIN}"
"${GRANT_PERMISSIONS_TO_APPLICATION_USER_ADMIN}"
"${CREATE_USER_CONTENT_ADMIN_ROLE_NO_LOGIN}"
"${CREATE_USER_CONTENT_KEYSPACE}"
"${CREATE_IMAGE_TABLE}"
"${CREATE_SAVED_SEARCHES_TABLE}"
"${GRANT_MODIFY_IMAGES_PERMISSIONS_TO_CONTENT_ADMIN}"
"${GRANT_SELECT_IMAGES_PERMISSIONS_TO_CONTENT_ADMIN}"
"${GRANT_MODIFY_SAVED_SEARCHES_PERMISSIONS_TO_CONTENT_ADMIN}"
"${GRANT_SELECT_SAVED_SEARCHES_PERMISSIONS_TO_CONTENT_ADMIN}"
"${CREATE_APPLICATION_CONTENT_USER_ADMIN_WITH_LOGIN}"
"${GRANT_PRIVILEGE_APPLICATION_CONTENT_USER_ADMIN}"
)

docker run --name ${CONTAINER_NAME} -p 9160:${CONTAINER_PORT} -v ${CASSANDRA_DB_HOST_VOLUME}:/var/lib/cassandra -d cassandra:${CASSANDRA_DOCKER_IMAGE_TAG} 

while [ `docker ps | grep ${CONTAINER_NAME} | wc -l` -eq 0 ]; do 
    sleep 5
    echo "Waiting for ${CONTAINER_NAME} to start..."
done

docker exec ${CONTAINER_NAME} sed -i -e "s|authenticator: AllowAllAuthenticator|authenticator: PasswordAuthenticator|" ./etc/cassandra/cassandra.yaml
docker exec ${CONTAINER_NAME} sed -i -e "s|authorizer: AllowAllAuthorizer|authorizer: CassandraAuthorizer|" ./etc/cassandra/cassandra.yaml
docker exec ${CONTAINER_NAME} sed -i -e "s|^#MAX_HEAP_SIZE=\"4G\"|MAX_HEAP_SIZE=\"512M\"|" /etc/cassandra/cassandra-env.sh 
docker exec ${CONTAINER_NAME} sed -i -e "s|^#HEAP_NEWSIZE=\"800M\"|HEAP_NEWSIZE=\"128M\"|" /etc/cassandra/cassandra-env.sh

docker restart ${CONTAINER_NAME}

while true; do
    docker exec ${CONTAINER_NAME} ${CQLSH_LOGIN} 2>/dev/null
    if [ $? -ne 0 ]; then 
        sleep 5
        echo "Waiting for cassandra to start..."
    else 
        echo "Cassandra is up."
        break
    fi
done

echo "Starting query execution..."
arraylength=${#QUERIES[@]}
for (( i=0; i<${arraylength}; i++ )); do
    echo "Executing: ${QUERIES[$i]}"
  docker exec ${CONTAINER_NAME}  ${CQLSH_LOGIN} -e "${QUERIES[$i]}"
    if [ $? -ne 0 ]; then
        exit 1
    fi
done

echo "Successfully initialized db schema!"