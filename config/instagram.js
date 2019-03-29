var in_client_id = '7f1419930e724ffea8642d1f4cc70a12',
	in_client_secret = '944ac21b95704d68a77d638873bd1622',
	in_redirect_uri = 'http://localhost:80/account/oauth',
	in_auth_url = 'https://api.instagram.com/oauth/authorize/?client_id=' + in_client_id + '&redirect_uri=' + in_redirect_uri + '&response_type=code'

module.exports = {

	instagram: {
		client_id: in_client_id,
		client_secret: in_client_secret,
		auth_url: in_auth_url,
		redirect_uri: in_redirect_uri
	}

};
