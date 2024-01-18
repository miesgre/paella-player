
import { DomClass, createElementWithHtmlText } from './dom';

const g_style = `
    background-color: #e4e4e4;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: absolute;
    top: 50%;
    transform: translateY(-50%); 
`
const g_imgStyle = `
    width: 100%;
`;

const g_iconContainerStyle = `
    position: absolute; 
    top: 0px; 
    left: 0px; 
    right: 0px; 
    bottom: 0px; 
    display: flex;
    align-content: center;
    justify-content: center;
    align-items: center;
`;

const g_iconStyle = `
    pointer-events: none;
    width: 20%;
    max-width: 400px;
    min-width: 100px;
    opacity: 0.6;
`;

const g_buttonStyle = `
    display: block;
    width: 20%;
    background: none;
    border: none;
    cursor: pointer;
`;

import PlayIcon from '../../icons/play_icon_fullscreen';

export default class PreviewContainer extends DomClass {
    constructor(player, parentElement,backgroundImage,backgroundImagePortrait) {
        const attributes = {
            "class": "preview-container",
            "style": g_style,
            "role": "button",
            "aria-label": "Play video"
        };
        super(player, {attributes, parent: parentElement});

        this._img = createElementWithHtmlText(`
        <div style="${g_imgStyle}">
            ${ backgroundImage ? `<img style="${g_imgStyle}" src="${backgroundImage}" class="preview-image-landscape" alt=""/>` : "" }
            ${ backgroundImagePortrait ? `<img style="${g_imgStyle}" src="${backgroundImagePortrait}" class="preview-image-portrait" alt=""/>` : "" }
            <div style="${ g_iconContainerStyle }">
                <button style="${g_buttonStyle}" role="button" aria-label="Play video">
                    <i class="preview-play-icon" style="${ g_iconStyle }">${ PlayIcon }</i>
                </button>
            </div>
        </div>
        `, this.element);

        this.element.setAttribute('id','playerContainerClickArea');
        this.element.addEventListener("click", (evt) => {
            player.play();
        });

        const mustCheckOrientation = backgroundImage && backgroundImagePortrait;
        const checkOrientation = () => {
            if (mustCheckOrientation) {
                const aspectRatio = this.element.clientWidth / this.element.clientHeight;
                const landscapeElements = Array.from(this.element.getElementsByClassName('preview-image-landscape'));
                const portraitElements = Array.from(this.element.getElementsByClassName('preview-image-portrait'));
                if (aspectRatio>=1) {
                    landscapeElements.forEach(e => e.style.display = "");
                    portraitElements.forEach(e => e.style.display = "none");
                }
                else {
                    landscapeElements.forEach(e => e.style.display = "none");
                    portraitElements.forEach(e => e.style.display = "");
                }
            }
        }

        window.addEventListener("resize", () => {
            checkOrientation();
        });

        checkOrientation();
    }

    loadBackgroundImage(src) {
        this._img.setAttribute("src",src);
    }
}
