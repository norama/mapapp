/**
 * Origin: https://github.com/metaodi/GFTPrototype/blob/master/services/OAuthToken.php
 * Idea: https://khayer.wordpress.com/category/gis/fusion-table/
 */
<?php
require_once 'lib/Google_Client.php';

function generate_jsonp($jsonString,$functionName="callback") 
{
	return $functionName."(".$jsonString.");";
}

/* Define all constants */
const CLIENT_ID = '877693859222-rngjk69c9lhp39mqc3u0clibs91c2kik.apps.googleusercontent.com';
const FT_SCOPE = 'https://www.googleapis.com/auth/fusiontables';
const SERVICE_ACCOUNT_NAME = 'rich-tribute-135219@appspot.gserviceaccount.com';
const KEY_FILE = 'keys/privatekey.p12';

$client = new Google_Client();
$client->setApplicationName("MapApp");
$client->setClientId(CLIENT_ID);

//add key
$key = file_get_contents(KEY_FILE);
$client->setAssertionCredentials(new Google_AssertionCredentials(
    SERVICE_ACCOUNT_NAME,
    array(FT_SCOPE),
    $key)
);

//reuse key if it's saved in the session
session_start();
$expired = false;
if (isset($_SESSION['token'])) 
{
	$client->setAccessToken($_SESSION['token']);
	$accessToken = json_decode($client->getAccessToken());
	if (($accessToken->created + ($accessToken->expires_in - 30)) < time()) 
	{
		$expired = true;
	}
} 

if (!isset($_SESSION['token']) || $expired)
{
	$client::$auth->refreshTokenWithAssertion();
}

if ($client->getAccessToken()) 
{
	if (isset ($_GET['jsonp']) && $_GET['jsonp'] != "") 
	{
		print generate_jsonp($client->getAccessToken(),$_GET['jsonp']);
	}
	else 
	{
		print $client->getAccessToken();
	}

	//save to key for the session
	$_SESSION['token'] = $client->getAccessToken();
}
?>