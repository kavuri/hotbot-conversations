pool_id='*****'
client_id='****'
domain='****'
aws cognito-idp describe-user-pool --user-pool-id $pool_id > cognito_userpool.cfg
aws cognito-idp describe-user-pool-client --user-pool-id $pool_id --client-id $client_id > user_pool_Alexa_client.json
aws cognito-idp describe-user-pool-client --user-pool-id $pool_id --client-id $client_id > user_pool_api_client.json
aws cognito-idp describe-user-pool-domain --domain $domain > user_pool_domain.json
echo "dumped all data..."
