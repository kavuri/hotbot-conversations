pool_id='ap-south-1_M1pQu9BIA'
client_id='1v9nbc9ck9uo242tt9429ptcn4'
domain='kamamishu1'
aws cognito-idp describe-user-pool --user-pool-id $pool_id > cognito_userpool.cfg
aws cognito-idp describe-user-pool-client --user-pool-id $pool_id --client-id $client_id > user_pool_Alexa_client.json
aws cognito-idp describe-user-pool-client --user-pool-id $pool_id --client-id $client_id > user_pool_api_client.json
aws cognito-idp describe-user-pool-domain --domain $domain > user_pool_domain.json
echo "dumped all data..."
