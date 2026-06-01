import { getRewardContributions } from "./cred-bureau-rewards-store";

export async function sendRewardSubmissionTelegramNotification(contributionId: string): Promise<boolean> {
  const contributions = getRewardContributions();
  const contribution = contributions.find(c => c.id === contributionId);
  if (!contribution) {
    throw new Error(`Contribution ${contributionId} not found`);
  }

  // Telegram group chat ID for "Fool Spectrum"
  const telegramChatId = "-1003392249295";
  const botToken = process.env.SYNAGENT_TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn("SYNAGENT_TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  const message = `New Cred Bureau rewards submission

Title: ${contribution.title}
Category: ${contribution.categoryId}
Status: ${contribution.status}
Submitted: ${new Date(contribution.createdAt).toLocaleString()}

View public submissions: https://synagent.helixa.xyz/cred-bureau/rewards/public`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json();

    if (result.ok) {
      console.log(`Telegram notification sent for contribution ${contributionId}`);
      return true;
    } else {
      console.error(`Telegram API error: ${result.description}`);
      return false;
    }
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
    return false;
  }
}

export function notifyRewardSubmission(contributionId: string): void {
  // Fire and forget - don't wait for the async operation
  sendRewardSubmissionTelegramNotification(contributionId).catch(error => {
    console.error("Failed to send reward submission notification:", error);
  });
}
