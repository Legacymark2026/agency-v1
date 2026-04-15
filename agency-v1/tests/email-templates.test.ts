import { test, describe } from 'node:test';
import assert from 'node:assert';
import { VIPWelcomeTemplate, AdminAlertTemplate, getNotificationHtml } from '../lib/email-templates.ts';

describe('Email Templates', () => {
    describe('VIPWelcomeTemplate', () => {
        test('should include the user name', () => {
            const name = 'John Doe';
            const html = VIPWelcomeTemplate(name);
            assert.ok(html.includes(`Hola ${name},`));
        });

        test('should have basic HTML structure', () => {
            const html = VIPWelcomeTemplate('Test');
            assert.ok(html.includes('<!DOCTYPE html>'));
            assert.ok(html.includes('<style>'));
            assert.ok(html.includes('LEGACY MARK'));
        });
    });

    describe('AdminAlertTemplate', () => {
        test('should include all provided information', () => {
            const data = {
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '+123456789',
                company: 'Tech Corp',
                note: 'Interested in VIP card'
            };
            const html = AdminAlertTemplate(data.name, data.email, data.phone, data.company, data.note);

            assert.ok(html.includes(data.name));
            assert.ok(html.includes(data.email));
            assert.ok(html.includes(data.phone));
            assert.ok(html.includes(data.company));
            assert.ok(html.includes(`"${data.note}"`));
        });

        test('should handle missing optional fields with N/A', () => {
            const html = AdminAlertTemplate('Jane Smith', 'jane@example.com', '', '', '');

            assert.ok(html.includes('N/A'));
            assert.strictEqual(html.includes('class="note"'), false);
        });

        test('should show note section only if note is provided', () => {
            const withNote = AdminAlertTemplate('Name', 'email', 'phone', 'company', 'Some note');
            assert.ok(withNote.includes('class="note"'));

            const withoutNote = AdminAlertTemplate('Name', 'email', 'phone', 'company', '');
            assert.strictEqual(withoutNote.includes('class="note"'), false);
        });
    });

    describe('getNotificationHtml', () => {
        test('should include title and message', () => {
            const data = {
                title: 'Test Notification',
                message: 'This is a test message'
            };
            const html = getNotificationHtml(data);

            assert.ok(html.includes(data.title));
            assert.ok(html.includes(data.message));
        });

        test('should include link when provided', () => {
            const data = {
                title: 'Test',
                message: 'Test',
                link: 'https://example.com/details'
            };
            const html = getNotificationHtml(data);

            assert.ok(html.includes('href="https://example.com/details"'));
            assert.ok(html.includes('Ver Detalles'));
        });

        test('should not include link button when link is not provided', () => {
            const data = {
                title: 'Test',
                message: 'Test'
            };
            const html = getNotificationHtml(data);

            assert.strictEqual(html.includes('Ver Detalles'), false);
            assert.strictEqual(html.includes('href='), false);
        });
    });
});
