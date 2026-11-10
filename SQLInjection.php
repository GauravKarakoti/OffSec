<?php
$uname = $_POST['uname'];
$password = $_POST['password'];

$sql_query = "SELECT * FROM users WHERE user_name = '$uname' AND password='$passwd'";
$result = mysqli_query($con, $sql_query);
?>