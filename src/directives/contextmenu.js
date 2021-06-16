// import Vue from "vue";
import { isFunction, isEmpty } from '@/utils/validate';
// eslint-disable-next-line import/no-cycle
import WitalkPopover from '../components/popover';

let popover;

const hidePopover = () => {
    if (popover) popover.style.display = 'none';
};
const showPopover = () => {
    if (popover) popover.style.display = 'block';
};
document.addEventListener('click', () => {
    hidePopover();
});
export default {
    hide: hidePopover,
    bind(el, binding, vnode) {
        el.addEventListener(
            binding.modifiers.click ? 'click' : 'contextmenu',
            (e) => {
                if (isEmpty(binding.value) || !Array.isArray(binding.value)) return;
                if (binding.modifiers.click) e.stopPropagation();
                e.preventDefault();
                WitalkPopover.methods.closeAll();

                let component;
                const visibleItems = [];
                if (binding.modifiers.message) component = vnode.context;
                else if (binding.modifiers.contact) component = vnode.child;

                if (!popover) {
                    popover = document.createElement('div');
                    popover.className = 'witalk-contextmenu';
                    document.body.appendChild(popover);
                }
                popover.innerHTML = binding.value
                    .map((item) => {
                        let visible;
                        if (isFunction(item.visible)) {
                            visible = item.visible(component);
                        } else {
                            visible = !item.visible ? true : item.visible;
                        }

                        if (visible) {
                            visibleItems.push(item);
                            const icon = item.icon
                                ? `<i class="witalk-contextmenu-icon ${item.icon}"></i>`
                                : '';
                            return `<div style="color:${item.color}" title="${
                                item.text
                            }" class="witalk-contextmenu-item">${icon}<span>${
                                item.text
                            }</span></div>`;
                        }
                        return '';
                    })
                    .join('');
                popover.style.top = `${e.pageY}px`;
                popover.style.left = `${e.pageX}px`;

                popover.childNodes.forEach((node, index) => {
                    // eslint-disable-next-line no-unused-vars
                    const { click, render } = visibleItems[index];
                    node.addEventListener('click', (event) => {
                        event.stopPropagation();
                        if (isFunction(click)) click(event, component, hidePopover);
                    });

                    // if (isFunction(render)) {
                    //   const ins = Vue.extend({
                    //     render: h => {
                    //       return render(h, component, hidePopover);
                    //     },
                    //   });
                    //   const renderComponent = new ins().$mount();
                    //   node.querySelector("span").innerHTML =
                    //     renderComponent.$el.outerHTML;
                    // }
                });

                showPopover();
            }
        );
    }
};
