<?php
$username = $password = "";
function logout() {
    // Initialize the session
    session_start();
    
    // Unset all of the session variables
    $_SESSION = array();
    
    // Destroy the session.
    session_destroy();
    
    // Redirect to login page
    header("location: /#login");
    exit;
}
function login() {
    require_once("config.php");
    // Check if username is empty
    if(empty($_POST["username"])){
        $error_login_username = "Please enter username.";
    } else{
        $username = trim($_POST["username"]);
    }
    
    // Check if password is empty
    if(empty($_POST["password"])){
        $error_login_password = "Please enter your password.";
    } else {
        $password = trim($_POST["password"]);
    }
    
    // Validate credentials
    if(empty($error_login_username) && empty($error_login_password)){
        // Prepare a select statement
        $sql = "SELECT id, username, password FROM users WHERE username = ?";
        
        if($stmt = mysqli_prepare($link, $sql)){
            // Bind variables to the prepared statement as parameters
            mysqli_stmt_bind_param($stmt, "s", $param_username);
            
            // Set parameters
            $param_username = $username;
            
            // Attempt to execute the prepared statement
            if(mysqli_stmt_execute($stmt)){
                // Store result
                mysqli_stmt_store_result($stmt);
                
                // Check if username exists, if yes then verify password
                if(mysqli_stmt_num_rows($stmt) == 1){                    
                    // Bind result variables
                    mysqli_stmt_bind_result($stmt, $id, $username, $hashed_password);
                    if(mysqli_stmt_fetch($stmt)){
                        if(password_verify($password, $hashed_password)){
                            // Password is correct, so start a new session
                            session_start();
                            
                            // Store data in session variables
                            $_SESSION["loggedin"] = true;
                            $_SESSION["id"] = $id;
                            $_SESSION["username"] = $username;                            
                            
                        } else{
                            // Password is not valid, display a generic error message
                            $error_login_user = "Invalid username or password.";
                        }
                    }
                } else{
                    // Username doesn't exist, display a generic error message
                    $error_login_user = "Invalid username or password.";
                }
            } else{
                echo "Oops! Something went wrong. Please try again later.";
            }

            // Close statement
            mysqli_stmt_close($stmt);
            
        }
    }
    
    // Close connection
    mysqli_close($link);
    return json_encode([
        "error_user" => $error_login_user,
        "error_username" => $error_login_username,
        "error_password" => $error_login_password
    ]);
}
function signup() {
    require_once("config.php");
    if(empty($_POST["username"])){
        $error_signup_username = "Please enter a username.";
    } elseif(!preg_match('/^[A-z0-9_]+$/', trim($_POST["username"]))){
        $error_signup_username = "Username can only contain letters, numbers, and underscores.";
    } else{
        // Prepare a select statement
        $sql = "SELECT id FROM users WHERE username = ?";
        if($stmt = mysqli_prepare($link, $sql)){
            // Bind variables to the prepared statement as parameters
            mysqli_stmt_bind_param($stmt, "s", $param_username);
            
            // Set parameters
            $param_username = trim($_POST["username"]);
            
            // Attempt to execute the prepared statement
            if(mysqli_stmt_execute($stmt)){
                /* store result */
                mysqli_stmt_store_result($stmt);
                
                if(mysqli_stmt_num_rows($stmt) == 1){
                    $error_signup_username = "This username is already taken.";
                } else{
                    $username = trim($_POST["username"]);
                }
            } else{
                echo "Oops! Something went wrong. Please try again later.";
            }

            // Close statement
            mysqli_stmt_close($stmt);
        }
    }
    
    // Validate password
    if(empty($_POST["password"])){
        $error_signup_password = "Please enter a password.";     
    } elseif(strlen(trim($_POST["password"])) < 6){
        $error_signup_password = "Password must have atleast 6 characters.";
    } else{
        $password = trim($_POST["password"]);
    }
    
    // Validate confirm password
    if(empty($_POST["confirm_password"])){
        $error_signup_confirmpassword = "Please confirm password.";     
    } else{
        $confirm_password = trim($_POST["confirm_password"]);
        if(empty($error_signup_password) && ($password != $confirm_password)){
            $error_signup_confirmpassword = "Password did not match.";
        }
    }
    
    // Check input errors before inserting in database
    if(empty($error_signup_username) && empty($error_signup_password) && empty($error_signup_confirmpassword)){
        
        // Prepare an insert statement
        $sql = "INSERT INTO users (username, password) VALUES (?, ?)";
         
        if($stmt = mysqli_prepare($link, $sql)){
            // Bind variables to the prepared statement as parameters
            mysqli_stmt_bind_param($stmt, "ss", $param_username, $param_password);
            
            // Set parameters
            $param_username = $username;
            $param_password = password_hash($password, PASSWORD_DEFAULT); // Creates a password hash
            
            // Attempt to execute the prepared statement
            if(!mysqli_stmt_execute($stmt)){
                
                $error_signup_user = "Oops! Something went wrong. Please try again later.";
            }

            // Close statement
            mysqli_stmt_close($stmt);
        }
    }
    
    // Close connection
    mysqli_close($link);
    return json_encode([
        "error_user" => $error_signup_user,
        "error_username" => $error_signup_username,
        "error_password" => $error_signup_password,
        "error_confirmpassword" => $error_signup_confirmpassword
    ]);
}
function resetPassword() {
    require_once "config.php";
 
    // Define variables and initialize with empty values
    $new_password = $confirm_password = "";
    $error_resetpass_newpass = $error_resetpass_confirmpass = "";
    
    // Processing form data when form is submitted
    
    // Validate new password
    if(empty(trim($_POST["new_password"]))){
        $error_resetpass_newpass = "Please enter the new password.";     
    } elseif(strlen(trim($_POST["new_password"])) < 6){
        $error_resetpass_newpass = "Password must have atleast 6 characters.";
    } else{
        $new_password = trim($_POST["new_password"]);
    }
    
    // Validate confirm password
    if(empty(trim($_POST["confirm_password"]))){
        $error_resetpass_confirmpass = "Please confirm the password.";
    } else{
        $confirm_password = trim($_POST["confirm_password"]);
        if(empty($error_resetpass_newpass) && ($new_password != $confirm_password)){
            $error_resetpass_confirmpass = "Password did not match.";
        }
    }
        
    // Check input errors before updating the database
    if(empty($error_resetpass_newpass) && empty($error_resetpass_confirmpass)){
        // Prepare an update statement
        $sql = "UPDATE users SET password = ? WHERE id = ?";
        
        if($stmt = mysqli_prepare($link, $sql)){
            // Bind variables to the prepared statement as parameters
            mysqli_stmt_bind_param($stmt, "si", $param_password, $param_id);
            
            // Set parameters
            $param_password = password_hash($new_password, PASSWORD_DEFAULT);
            $param_id = $_SESSION["id"];
            
            // Attempt to execute the prepared statement
            if(mysqli_stmt_execute($stmt)){
                // Password updated successfully. Destroy the session, and redirect to login page
                session_destroy();
            }

            // Close statement
            mysqli_stmt_close($stmt);
        }
    }
    
    // Close connection
    mysqli_close($link);
    return json_encode([
        "error_newpass" => $error_resetpass_newpass,
        "error_confirmpass" => $error_resetpass_confirmpass
    ]);
}
function getFiles() {
    require_once "config.php";
    $sql = "SELECT file_id, file_name, file_data, created_at FROM files WHERE user_id = ?";
    $files = [];
    if ($stmt = mysqli_prepare($link, $sql)) {
        mysqli_stmt_bind_param($stmt, "i", $id);
        session_start();
        $id = $_SESSION['id'];
        mysqli_stmt_execute($stmt);
        mysqli_stmt_bind_result($stmt, $file_id, $file_name, $file_data, $created_at);
        while (mysqli_stmt_fetch($stmt)) {
           $file = [];
           $file["name"] = $file_name;
           $file["id"] = $file_id;
           $file["data"] = $file_data;
           $file["created_at"] = $created_at;
           $files[] = $file;
        }
        mysqli_stmt_close($stmt);
    }
    mysqli_close($link);
    return json_encode($files);
}
function searchFile($search_id) {
    require_once "config.php";
    $sql = "SELECT file_id, file_name, file_data, created_at FROM files WHERE user_id = ? AND file_id = $search_id";
    if ($stmt = mysqli_prepare($link, $sql)) {
        mysqli_stmt_bind_param($stmt, "i", $id);
        session_start();
        $id = $_SESSION['id'];
        mysqli_stmt_execute($stmt);
        mysqli_stmt_bind_result($stmt, $file_id, $file_name, $file_data, $created_at);
        mysqli_stmt_fetch($stmt);
        $file = [
            "name" => $file_name,
            "id" => $file_id,
            "data" => $file_data,
            "created_at" => $created_at
        ];
        mysqli_stmt_close($stmt);
    }
    mysqli_close($link);
    return json_encode($file);
}
function createFile($file_name) {
    require_once "config.php";
    $result = true;
    $sql = "SELECT file_id FROM files WHERE user_id = ? AND file_name = ?";
    if ($stmt = mysqli_prepare($link, $sql)) {
        mysqli_stmt_bind_param($stmt, "is", $id, $file_name);
        session_start();
        $id = $_SESSION['id'];
        $result = mysqli_stmt_execute($stmt);
        mysqli_stmt_store_result($stmt);
                
        if(mysqli_stmt_num_rows($stmt) == 1){
            $file_err = "Already exists this file.";
            $result = false;
        }
    }
    if ($result) {
        $sql = "INSERT INTO files (user_id, file_name, file_data) VALUES (?, \"$file_name\", \"\")";
        if ($stmt = mysqli_prepare($link, $sql)) {
            mysqli_stmt_bind_param($stmt, "i", $id);
            $result = mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    }
    mysqli_close($link);
    return $result;
}
function uploadDataToFile($file_id, $data) {
    require_once "config.php";
    $sql = "UPDATE files SET file_data = ? WHERE file_id = ?";
    if ($stmt = mysqli_prepare($link, $sql)) {
        mysqli_stmt_bind_param($stmt, "si", $data, $file_id);
        $result = mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }
    mysqli_close($link);
    return true;
}
function deleteFile($file_id) {
    require_once "config.php";
    $sql = "DELETE FROM files WHERE file_id = ?";
    if ($stmt = mysqli_prepare($link, $sql)) {
        mysqli_stmt_bind_param($stmt, "i", $file_id);
        $result = mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }
    mysqli_close($link);
    return true;
}
function renameFile($file_id, $new_name) {
    require_once "config.php";
    $sql = "UPDATE files SET file_name = ? WHERE file_id = ?";
    if ($stmt = mysqli_prepare($link, $sql)) {
        mysqli_stmt_bind_param($stmt, "si", $new_name, $file_id);
        $result = mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }
    mysqli_close($link);
    return true;
}