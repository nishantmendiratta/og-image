import { toClipboard } from 'https://cdn.jsdelivr.net/npm/copee@1.0.6/dist/copee.mjs';

function debounce(func, wait) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			func.apply(context, args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

const ImagePreview = ({ src, onclick, onload, onerror, loading }) => {
    const style = {
        filter: loading ? 'blur(5px)' : '',
        opacity: loading ? 0.1 : 1,
    };
    return H('a',
        { className: 'image-wrapper', href: src, onclick },
        H('img',
            { src, onload, onerror, style }
        )
    );
}

const Dropdown = ({ options, value, onchange }) => {
    return H('div',
        { className: 'select-wrapper'},
        H('select',
            { onchange: e => onchange(e.target.value) },
            options.map(o =>
                H('option',
                    { value: o.value, selected: value === o.value },
                    o.text
                )
            )
        ),
        H('div',
            { className: 'select-arrow' },
            '▼'
        )
    );
}

const TextInput = ({ value, oninput }) => {
    return H('div',
        { className: 'input-outer-wrapper' },
        H('div',
            { className: 'input-inner-wrapper' },
            H('input',
                { type: 'text', value, oninput: e => oninput(e.target.value) }
            )
        )
    );
}

const Button = ({ label, onclick }) => {
    return H('button', { onclick }, label);
}

const Field = ({ label, input }) => {
    return H('div',
        { className: 'field' },
        H('label', { className: 'field-label' }, label),
        H('div', { className: 'field-value' }, input),
    );
}

const Toast = ({ show, message }) => {
    const style = { transform:  show ? 'translate3d(0,-0px,-0px) scale(1)' : '' };
    return H('div',
        { className: 'toast-area' },
        H('div',
            { className: 'toast-outer', style },
            H('div',
                { className: 'toast-inner' },
                H('div',
                    { className: 'toast-message'},
                    message
                )
            )
        ),
    );
}

const fileTypeOptions = [
    { text: 'PNG', value: 'png' },
    { text: 'JPEG', value: 'jpeg' },
];

const fontSizeOptions = Array
    .from({ length: 10 })
    .map((_, i) => i * 25)
    .filter(n => n > 0)
    .map(n => ({ text: n + 'px', value: n + 'px' }));

const markdownOptions = [
    { text: 'Plain Text', value: '0' },
    { text: 'Markdown', value: '1' },
];

const App = (props, state, setState) => {
    const setLoadingState = (newState) => setState({ ...newState, loading: true });
    const {
        fileType = 'png',
        fontSize = '75px',
        md = '1',
        text = '**Hello** World',
        images=['https://assets.zeit.co/image/upload/front/assets/design/now-black.svg'],
        showToast = false,
        messageToast = '',
        loading = true
    } = state;
    const url = new URL(window.location.hostname === 'localhost' ? 'https://og-image.now.sh' : window.location.origin);
    url.pathname = `${text}.${fileType}`;
    url.searchParams.append('md', md);
    url.searchParams.append('fontSize', fontSize);
    for (let image of images) {
        url.searchParams.append('images', image);
    }
    
    return H('div',
        { className: 'split' },
        H('div',
            { className: 'pull-left' },
            H('div',
                H(Field, {
                    label: 'File Type',
                    input: H(Dropdown, { options: fileTypeOptions, value: fileType, onchange: val => setLoadingState({fileType: val}) })
                }),
                H(Field, {
                    label: 'Font Size',
                    input: H(Dropdown, { options: fontSizeOptions, value: fontSize, onchange: val => setLoadingState({fontSize: val}) })
                }),
                H(Field, {
                    label: 'Text Type',
                    input: H(Dropdown, { options: markdownOptions, value: md, onchange: val => setLoadingState({ md: val }) })
                }),
                H(Field, {
                    label: 'Text Input',
                    input: H(TextInput, {
                        value: text,
                        oninput: debounce(val => {
                            setLoadingState({ text: val });
                        }, 150)
                    })
                }),
                ...images.map((image, i) => H(Field, {
                    label: `Image ${i + 1}`,
                    input: H(TextInput, {
                        value: image,
                        oninput: debounce(val => {
                            let clone = [...images];
                            clone[i] = val;
                            setLoadingState({ images: clone });
                        }, 150)
                    })
                })),
                H(Field, {
                    label: `Image ${images.length + 1}`,
                    input: H(Button, {
                        label: `Add Image ${images.length + 1}`,
                        onclick: () => { setLoadingState({ images: [...images, ''] }) }
                    }),
                }),
            )
        ),
        H('div',
            { clasName: 'pull-right' },
            H(ImagePreview, {
                src: url.href,
                loading: loading,
                onload: e => setState({ loading: false }),
                onerror: e => {
                    setState({ showToast: true, messageToast: 'Oops, an error occurred' });
                    setTimeout(() => setState({ showToast: false }), 2000);
                },
                onclick: e => {
                    e.preventDefault();
                    const success = toClipboard(url.href);
                    if (success) {
                        setState({ showToast: true, messageToast: 'Copied image URL to clipboard' });
                        setTimeout(() => setState({ showToast: false }), 3000);
                    } else {
                        window.open(url.href, '_blank');
                    }
                    return false;
                }
            })
        ),
        H(Toast, {
            message: messageToast,
            show: showToast,
        })
    );
};

R(H(App), document.getElementById('generated'));