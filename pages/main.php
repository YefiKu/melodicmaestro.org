<header id="mainHeader">
    <div class="accountContent">Your account</div>
    <div class="info"><span class="redir" data-redir="library" data-align="left">Library</span> | <span class="redir" data-redir="editor" data-align="left">Editor</span></div>
</header>
<div class="wrapper">
    <?php
    session_start();
    if ($_SESSION['id']) {?>
        <h1>Hello, <?=$_SESSION['username']?>!</h1>
    <?php } else {?>
        <h1>Hello! You need to <a class="redir" data-redir="login" data-align="left">login</a></h1>
    <?php }?>
</div>