export default function (selector, create, attrs, childs) {
	let el;
	if (typeof selector !== 'string') el = selector;
	else if (create) el = document.createElementNS('http://www.w3.org/2000/svg', selector);
	else el = document.querySelector(selector);
	attrs ? Object.keys(attrs).forEach(key => el.setAttribute(key, attrs[key])) : 0;
	childs ? el.append(...childs) : 0;
	return el;
}
/*export function get(selector) {
	return document.querySelector(selector);
}
export function create(el) {
	return document.createElementNS('http://www.w3.org/2000/svg', el);
}
export function attrs(el, attributes) {
	Object.keys(attributes).forEach(key => el.setAttribute(key, attributes[key]));
	return el;
}*/