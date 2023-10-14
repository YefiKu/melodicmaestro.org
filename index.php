<?php
if ($_SERVER['REQUEST_METHOD'] == "POST") {
    require "global.php";
    switch ($_GET['q']) {
        case "logout":
            logout();
            break;
        case "me":
            session_start();
            echo(json_encode([
                "username"=>$_SESSION["username"],
                "loggedin"=>$_SESSION["loggedin"],
                "id"=>$_SESSION["id"]
            ]));
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
                    if ($_GET['path']) {
                        echo createItem("file", $_GET['path']);
                    }
                    break;
                case 'upload':
                    if ($_GET['id'] && $_GET['data']) {
                        echo uploadDataToFile($_GET['id'], $_GET['data']);
                    }
                    break;
                case 'delete':
                    if ($_GET['id']) {
                        deleteItem("file", $_GET['id']);
                    }
                    break;
                case 'move':
                    if ($_GET['id'] && $_GET['path']) {
                        moveItem("file", $_GET['id'], $_GET['path']);
                    }
                    break;
                default:
                    echo(getItems());
                    break;
            }
            break;
        case "folders":
            switch ($_GET['action']) {
                case 'create':
                    if ($_GET['path']) {
                        createItem("folder", $_GET['path']);
                    }
                    break;
                case 'delete':
                    if ($_GET['id']) {
                        deleteItem("folder", $_GET['id']);
                    }
                    break;
                case 'move':
                    if ($_GET['id'] && $_GET['path']) {
                        moveItem("folder", $_GET['id'], $_GET['path']);
                    }
                    break;
                default:
                    echo(getItems());
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