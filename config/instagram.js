var in_client_id = '<CLIENT_ID>',
	in_client_secret = '<CLIENT_SECRET>',
	in_redirect_uri = 'http://localhost/account/oauth/instagram', // Check your port...
	in_auth_url = 'https://api.instagram.com/oauth/authorize/?client_id=' + in_client_id + '&redirect_uri=' + in_redirect_uri + '&response_type=code'

module.exports = {
		client_id: in_client_id,
		client_secret: in_client_secret,
		auth_url: in_auth_url,
		redirect_uri: in_redirect_uri
};
