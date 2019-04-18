var in_client_id = process.env.i_client_id || '<CLIENT_ID>',
	in_client_secret = process.env.i_secret ||'<CLIENT_SECRET>',
	in_redirect_uri = process.env.i_redirect_uri || '<host>:<port>/account/oauth/instagram',
	in_auth_url = 'https://api.instagram.com/oauth/authorize/?client_id=' + in_client_id + '&redirect_uri=' + in_redirect_uri + '&response_type=code'

module.exports = {

	instagram: {
		client_id: in_client_id,
		client_secret: in_client_secret,
		auth_url: in_auth_url,
		redirect_uri: in_redirect_uri
	}

};
