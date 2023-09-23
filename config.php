<?php
define('DB_SERVER', 'sopilka.org');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', 'passclef');
define('DB_NAME', 'sopilka');

$link = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);
// Check connection
if($link === false || $link == NULL){
    die("ERROR: Could not connect. " . mysqli_connect_error());
}