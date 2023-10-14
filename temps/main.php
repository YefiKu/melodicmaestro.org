<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="robots" content="index,follow">
	<meta name="keywords" content="editor,clef,music,writing,yefi,YES,free editor,hafi mus,note,note writing">
	<meta name="description" content="You can create music for free! - hafi mus">
	<title>Melody editor by YES</title>
	<link rel="stylesheet" type="text/css" href="styles.css">
	<link rel="icon" href="favicon.ico"/>
	<script>
		let tab;
		let openedTabs;
		function openTab(name, align) {
			if (!name?.length) return;
			let oldTab = document.querySelector(`.tab[data-tab=${tab}]`);
			let newTab = document.querySelector(`.tab[data-tab=${name}]`);
			if (align === 'left') {
				oldTab.after(newTab);
				openedTabs.style.transform = 'translateX(0%)';
				openedTabs.style.animation = "moveToLeft 500ms";
			} else {
				oldTab.before(newTab);
				openedTabs.style.transform = 'translateX(-50%)';
				openedTabs.style.animation = "moveToRight 500ms";
			}
			setTimeout(() => {
				newTab.style.left = 0;
				openedTabs.style.animation = "";
				openedTabs.style.transform = 'translateX(0%)';
				document.body.append(oldTab);
				location.hash = '#' + tab;
			}, 480);
			tab = name; 
		}
		async function refresh(e) {
			tab = e.oldUrl?.split('#')[1] || location.hash.slice(1);
			openedTabs = document.querySelector('.openedTabs');
			[...openedTabs.children].forEach(ch => document.body.append(ch));
			openedTabs.innerHTML = '';
			if (!tab.length) tab = 'main';
			let tabElm = document.querySelector(`.tab[data-tab=${tab}]`) || document.querySelector(`.tab[data-tab=notfound]`);
			openedTabs.append(tabElm);
			if (e.newUrl) openTab(e.newUrl.split('#')[1], 'right');
			document.querySelectorAll(".redir").forEach(el => el.onclick = () => openTab(el.dataset.redir, el.dataset.align));
		}
		window.onload = refresh;
		window.onhashchange = refresh;
	</script>
	<script src="/js/script.js" type="module"></script>
</head>
<body>
	<div class="openedTabs"></div>
	<div class="tab main" data-tab="main"><?php require 'pages/main.html';?></div>
	<div class="tab library" data-tab="library"><?php require 'pages/library.html';?></div>
	<div class="tab editor" data-tab="editor"><?php require 'pages/editor.html';?></div>
	<div class="tab login" data-tab="login"><?php require 'pages/login.html';?></div>
	<div class="tab signup" data-tab="signup"><?php require 'pages/signup.html';?></div>
	<div class="tab resetpassword" data-tab="resetpassword"><?php require 'pages/reset-password.html';?></div>
	<div class="tab notfound" data-tab="notfound"><?php require '404.html';?></div>
</div>
</body>
</html>