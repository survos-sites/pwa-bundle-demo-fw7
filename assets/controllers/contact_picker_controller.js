import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'contacts',
        'empty',
        'message',
        'multiple',
        'properties',
        'selectButton',
        'status',
        'statusIcon',
    ];

    connect() {
        this.iconUrls = [];
        this.onSelection = ({ detail }) => this.showContacts(detail.contacts);
        this.onUnavailable = () => this.showUnavailable();
        this.onError = ({ detail }) => this.showError(detail.exception);
        this.element.addEventListener('pwa--contact:selection', this.onSelection);
        this.element.addEventListener('pwa--contact:unavailable', this.onUnavailable);
        this.element.addEventListener('pwa--contact:error', this.onError);
        this.checkSupport();
    }

    disconnect() {
        this.element.removeEventListener('pwa--contact:selection', this.onSelection);
        this.element.removeEventListener('pwa--contact:unavailable', this.onUnavailable);
        this.element.removeEventListener('pwa--contact:error', this.onError);
        this.releaseIcons();
    }

    async checkSupport() {
        if (!('contacts' in navigator)) {
            this.showUnavailable();
            return;
        }

        try {
            const properties = await navigator.contacts.getProperties();
            this.showProperties(properties);
            this.statusTarget.textContent = 'Native contact picker available';
            this.messageTarget.textContent = 'Choose one or more contacts to display their available details.';
        } catch (error) {
            this.showError(error);
        }
    }

    async select() {
        const controller = this.application.getControllerForElementAndIdentifier(this.element, 'pwa--contact');
        if (!controller) {
            this.showUnavailable();
            return;
        }

        this.selectButtonTarget.disabled = true;
        this.statusTarget.textContent = 'Opening native contact picker…';
        this.messageTarget.textContent = 'Search for and select contacts in the system interface.';
        this.statusIconTarget.textContent = 'person_crop_circle_badge_plus';
        await controller.select(this.multipleTarget.checked);
        this.selectButtonTarget.disabled = false;
    }

    showProperties(properties) {
        const labels = {
            address: 'Postal address',
            email: 'Email',
            icon: 'Avatar',
            name: 'Name',
            tel: 'Telephone',
        };
        this.propertiesTarget.replaceChildren(...properties.map((property) => {
            const chip = document.createElement('div');
            chip.className = 'chip margin-right-half margin-bottom-half';
            const label = document.createElement('div');
            label.className = 'chip-label';
            label.textContent = labels[property] || property;
            chip.append(label);
            return chip;
        }));
    }

    showContacts(contacts) {
        this.releaseIcons();
        this.contactsTarget.replaceChildren(...contacts.map((contact, index) => this.createContactCard(contact, index)));
        this.emptyTarget.hidden = contacts.length > 0;
        this.statusTarget.textContent = contacts.length === 1 ? '1 contact selected' : `${contacts.length} contacts selected`;
        this.messageTarget.textContent = 'The selected contact details are shown below.';
        this.statusIconTarget.textContent = 'checkmark_circle';
        this.selectButtonTarget.disabled = false;
    }

    createContactCard(contact, index) {
        const names = this.unique(contact.name);
        const primaryName = names[0] || `Selected contact ${index + 1}`;
        const card = document.createElement('div');
        card.className = 'card card-outline';

        const header = document.createElement('div');
        header.className = 'card-header display-flex align-items-center';
        header.append(this.createAvatar(contact.icon, primaryName));
        const heading = document.createElement('div');
        heading.className = 'margin-left';
        const title = document.createElement('div');
        title.className = 'font-weight-600';
        title.textContent = primaryName;
        heading.append(title);
        names.slice(1).forEach((name) => {
            const alternate = document.createElement('div');
            alternate.className = 'text-color-gray';
            alternate.textContent = name;
            heading.append(alternate);
        });
        header.append(heading);

        const content = document.createElement('div');
        content.className = 'card-content';
        const list = document.createElement('div');
        list.className = 'list media-list no-margin';
        const items = document.createElement('ul');

        this.unique(contact.email).forEach((email) => {
            items.append(this.createDetail('envelope', 'Email', email, `mailto:${email}`));
        });
        this.unique(contact.tel).forEach((telephone) => {
            items.append(this.createDetail('phone', 'Telephone', telephone, `tel:${this.phoneHref(telephone)}`));
        });
        (contact.address || []).forEach((address) => {
            const formatted = this.formatAddress(address);
            if (formatted) items.append(this.createDetail('location', 'Postal address', formatted));
        });

        if (!items.children.length) {
            items.append(this.createDetail('info_circle', 'Shared details', 'No additional details were provided.'));
        }

        list.append(items);
        content.append(list);
        card.append(header, content);
        return card;
    }

    createAvatar(icons, name) {
        if (icons?.[0] instanceof Blob) {
            const url = URL.createObjectURL(icons[0]);
            this.iconUrls.push(url);
            const image = document.createElement('img');
            image.src = url;
            image.alt = `${name}'s avatar`;
            image.width = 48;
            image.height = 48;
            image.style.cssText = 'border-radius:50%;object-fit:cover;';
            return image;
        }

        const avatar = document.createElement('i');
        avatar.className = 'icon f7-icons size-48 color-primary';
        avatar.textContent = 'person_crop_circle_fill';
        return avatar;
    }

    createDetail(iconName, label, value, href = null) {
        const item = document.createElement('li');
        const content = document.createElement(href ? 'a' : 'div');
        content.className = href ? 'item-link item-content external' : 'item-content';
        if (href) content.href = href;

        const media = document.createElement('div');
        media.className = 'item-media';
        const icon = document.createElement('i');
        icon.className = 'icon f7-icons';
        icon.textContent = iconName;
        media.append(icon);

        const inner = document.createElement('div');
        inner.className = 'item-inner';
        const title = document.createElement('div');
        title.className = 'item-title-row';
        const titleText = document.createElement('div');
        titleText.className = 'item-title';
        titleText.textContent = label;
        title.append(titleText);
        const detail = document.createElement('div');
        detail.className = 'item-text';
        detail.textContent = value;
        detail.style.whiteSpace = 'pre-line';
        inner.append(title, detail);
        content.append(media, inner);
        item.append(content);
        return item;
    }

    formatAddress(address) {
        const lines = [];
        if (address.recipient) lines.push(address.recipient);
        if (address.organization) lines.push(address.organization);
        if (address.addressLine) lines.push(...address.addressLine);
        const locality = [address.dependentLocality, address.city, address.region, address.postalCode]
            .filter(Boolean)
            .join(', ');
        if (locality) lines.push(locality);
        if (address.country) lines.push(address.country);
        return this.unique(lines).join('\n');
    }

    showUnavailable() {
        this.statusTarget.textContent = 'Contact Picker API unavailable';
        this.messageTarget.textContent = 'Open this page in Android Chrome to test the native contact picker.';
        this.statusIconTarget.textContent = 'xmark_circle';
        this.selectButtonTarget.disabled = true;
        this.propertiesTarget.innerHTML = '<span class="text-color-gray">No contact properties are available.</span>';
    }

    showError(error) {
        if (error?.name === 'AbortError') {
            this.statusTarget.textContent = 'Contact selection cancelled';
            this.messageTarget.textContent = 'The picker closed without selecting any contacts.';
            this.statusIconTarget.textContent = 'xmark_circle';
        } else {
            this.statusTarget.textContent = 'Contacts could not be selected';
            this.messageTarget.textContent = 'The browser or operating system could not complete the selection.';
            this.statusIconTarget.textContent = 'exclamationmark_triangle';
        }
        this.selectButtonTarget.disabled = false;
    }

    unique(values = []) {
        return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
    }

    phoneHref(number) {
        return number.normalize('NFKD').replace(/[^+\d]/g, '');
    }

    releaseIcons() {
        this.iconUrls.forEach((url) => URL.revokeObjectURL(url));
        this.iconUrls = [];
    }
}
