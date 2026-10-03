"""Sends account emails (verify address, reset password) over SMTP.

Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM.
With Gmail, use smtp.gmail.com, port 587 and an App Password.
If SMTP is not set, the link is written to the server log instead.
"""
import logging
import smtplib
import ssl
from email.message import EmailMessage
from html import escape

from app.config import get_settings

log = logging.getLogger("mailer")
settings = get_settings()


def is_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from)


def send(to: str, subject: str, text: str, html: str | None = None) -> None:
    if not is_configured():
        log.warning("SMTP is not set up. Email to %s (%s):\n%s", to, subject, text)
        return
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")
    try:
        context = ssl.create_default_context()
        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=context, timeout=20) as s:
                if settings.smtp_user:
                    s.login(settings.smtp_user, settings.smtp_password)
                s.send_message(msg)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as s:
                s.starttls(context=context)
                if settings.smtp_user:
                    s.login(settings.smtp_user, settings.smtp_password)
                s.send_message(msg)
    except Exception:  # never break a request because email failed
        log.exception("Could not send email to %s", to)


def _layout(heading: str, body_en: str, body_km: str, button: str, link: str, note: str) -> str:
    link_e = escape(link, quote=True)
    return f"""<!doctype html><html><body style="margin:0;background:#fff7ed;font-family:Arial,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px" cellpadding="0" cellspacing="0">
<tr><td>
<p style="margin:0 0 8px;font-weight:bold;color:#ea580c">Meakutes-Khmer</p>
<h1 style="margin:0 0 16px;font-size:22px">{escape(heading)}</h1>
<p style="margin:0 0 8px;line-height:1.6">{escape(body_en)}</p>
<p style="margin:0 0 24px;line-height:1.8">{escape(body_km)}</p>
<p style="margin:0 0 24px"><a href="{link_e}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold">{escape(button)}</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#6b7280">{escape(note)}</p>
<p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all">{link_e}</p>
</td></tr></table></td></tr></table></body></html>"""


def send_verification(to: str, link: str) -> None:
    send(
        to,
        "Confirm your email · Meakutes-Khmer",
        f"Welcome to Meakutes-Khmer!\n\nConfirm your email address to post reviews and comments:\n{link}\n\n"
        f"សូមបញ្ជាក់អាសយដ្ឋានអ៊ីមែលរបស់អ្នក ដើម្បីអាចបង្ហោះការវាយតម្លៃ និងមតិយោបល់។\n\n"
        "This link works for 48 hours. If you did not sign up, you can ignore this email.",
        _layout(
            "Confirm your email",
            "Welcome! Confirm your email address so you can post reviews and comments.",
            "សូមស្វាគមន៍! សូមបញ្ជាក់អាសយដ្ឋានអ៊ីមែលរបស់អ្នក ដើម្បីអាចបង្ហោះការវាយតម្លៃ និងមតិយោបល់។",
            "Confirm email · បញ្ជាក់អ៊ីមែល",
            link,
            "This link works for 48 hours. If you did not sign up, you can ignore this email.",
        ),
    )


def send_password_reset(to: str, link: str) -> None:
    send(
        to,
        "Reset your password · Meakutes-Khmer",
        f"Someone asked to reset the password for this account.\n\nChoose a new password here:\n{link}\n\n"
        f"ចុចតំណខាងលើ ដើម្បីកំណត់ពាក្យសម្ងាត់ថ្មី។\n\n"
        "This link works for 1 hour. If you did not ask for this, you can ignore this email.",
        _layout(
            "Reset your password",
            "Someone asked to reset the password for this account. Click below to choose a new one.",
            "មាននរណាម្នាក់បានស្នើសុំកំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់គណនីនេះ។ ចុចខាងក្រោម ដើម្បីជ្រើសរើសពាក្យសម្ងាត់ថ្មី។",
            "New password · ពាក្យសម្ងាត់ថ្មី",
            link,
            "This link works for 1 hour. If you did not ask for this, you can ignore this email.",
        ),
    )
