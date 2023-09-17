<?php
if ($_SERVER['REQUEST_METHOD'] == "POST") {
    require "global.php";
    switch ($_GET['q']) {
        case "logout":
            logout();
            break;
        case "login":
            echo(login());
            break;
        case "signup":
            echo(signup());
            break;
        case "resetpassword":
            // Initialize the session
            session_start();
            
            // Check if the user is logged in, otherwise redirect to login page
            if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
                header("location: /#login");
                exit;
            }
            echo(resetPassword());
            break;
        case "files":
            switch ($_GET['action']) {
                case 'create':
                    if ($_GET['name']) {
                        createFile($_GET['name']);
                    }
                    break;
                case 'upload':
                    if ($_GET['id'] && $_GET['data']) {
                        uploadDataToFile($_GET['id'], $_GET['data']);
                    }
                    break;
                case 'delete':
                    if ($_GET['id']) {
                        deleteFile($_GET['id']);
                    }
                    break;
                case 'rename':
                    if ($_GET['id'] && $_GET['name']) {
                        renameFile($_GET['id'], $_GET['name']);
                    }
                    break;
                default:
                    if ($_GET['id']) {
                        print_r(searchFile($_GET['id']));
                    } else {
                        print_r(getFiles());
                    }
                    break;
            }
            break;
        default:
            require('404.html');
    }
} elseif ($_SERVER['REQUEST_METHOD'] == 'GET') {
    switch ($_GET['q']) {
        case '':
            require('temps/main.php');
            break;
        default:
            require('404.html');
            break;
    }
}