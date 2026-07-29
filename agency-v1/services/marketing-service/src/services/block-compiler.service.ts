export type BlockType = "header" | "text" | "image" | "button" | "divider" | "columns" | "social" | "footer";

export interface HeaderBlock {
  type: "header";
  logoUrl?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  bgColor?: string;
  textColor?: string;
}

export interface TextBlock {
  type: "text";
  content: string;
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right" | "justify";
  padding?: number;
}

export interface ImageBlock {
  type: "image";
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  align?: "left" | "center" | "right";
  linkUrl?: string;
  borderRadius?: number;
}

export interface ButtonBlock {
  type: "button";
  label: string;
  url: string;
  bgColor?: string;
  textColor?: string;
  align?: "left" | "center" | "right";
  borderRadius?: number;
  fontSize?: number;
  paddingY?: number;
  paddingX?: number;
}

export interface DividerBlock {
  type: "divider";
  color?: string;
  thickness?: number;
  margin?: number;
}

export interface ColumnsBlock {
  type: "columns";
  count: 2 | 3;
  columns: EmailBlock[][];
}

export interface SocialLink {
  platform: "facebook" | "instagram" | "x" | "linkedin" | "website" | "youtube";
  url: string;
}

export interface SocialBlock {
  type: "social";
  align?: "left" | "center" | "right";
  links: SocialLink[];
}

export interface FooterBlock {
  type: "footer";
  companyName: string;
  address?: string;
  unsubscribeUrl?: string;
  textColor?: string;
}

export type EmailBlock =
  | HeaderBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | ColumnsBlock
  | SocialBlock
  | FooterBlock;

export interface EmailDesignJson {
  bgColor?: string;
  cardBgColor?: string;
  fontFamily?: string;
  maxWidth?: number;
  blocks: EmailBlock[];
}

export class BlockCompilerService {
  /**
   * Compilar un objeto EmailDesignJson a HTML responsive compatible con clientes de correo
   */
  static compileBlocksToHtml(design: EmailDesignJson): string {
    const bgColor = design.bgColor || "#0f172a";
    const cardBgColor = design.cardBgColor || "#1e293b";
    const fontFamily = design.fontFamily || "Arial, Helvetica, sans-serif";
    const maxWidth = design.maxWidth || 600;

    const compiledBlocksHtml = (design.blocks || []).map((block) => this.renderBlock(block)).join("\n");

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Campaign</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${bgColor}; font-family: ${fontFamily}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: #38bdf8; text-decoration: underline; }
    @media only screen and (max-width: 620px) {
      .container-table { width: 100% !important; max-width: 100% !important; }
      .column-td { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${bgColor}; width: 100%;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table class="container-table" role="presentation" width="${maxWidth}" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: ${maxWidth}px; background-color: ${cardBgColor}; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
          <tr>
            <td style="padding: 25px 20px;">
              ${compiledBlocksHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
  }

  private static renderBlock(block: EmailBlock): string {
    switch (block.type) {
      case "header": {
        const align = block.align || "center";
        const logo = block.logoUrl
          ? `<img src="${block.logoUrl}" alt="Logo" width="120" style="display: block; margin: 0 ${align === "center" ? "auto" : align === "right" ? "0 0 auto" : "0 auto 0"}; max-width: 150px; height: auto; margin-bottom: 15px;" />`
          : "";
        return `
          <div style="text-align: ${align}; margin-bottom: 20px;">
            ${logo}
            <h1 style="margin: 0; color: ${block.textColor || "#f8fafc"}; font-size: 24px; font-weight: bold;">${block.title}</h1>
            ${block.subtitle ? `<p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">${block.subtitle}</p>` : ""}
          </div>
        `;
      }

      case "text": {
        const align = block.align || "left";
        const fontSize = block.fontSize || 15;
        const color = block.color || "#cbd5e1";
        const padding = block.padding !== undefined ? block.padding : 10;
        return `
          <div style="text-align: ${align}; color: ${color}; font-size: ${fontSize}px; line-height: 1.6; padding: ${padding}px 0;">
            ${block.content}
          </div>
        `;
      }

      case "image": {
        const align = block.align || "center";
        const width = block.width ? `${block.width}px` : "100%";
        const borderRadius = block.borderRadius !== undefined ? `${block.borderRadius}px` : "8px";
        const imgTag = `<img src="${block.url}" alt="${block.alt || "Imagen"}" style="display: block; width: ${width}; max-width: 100%; height: auto; border-radius: ${borderRadius}; margin: 0 ${align === "center" ? "auto" : align === "right" ? "0 0 auto" : "0 auto 0"};" />`;
        const content = block.linkUrl ? `<a href="${block.linkUrl}" target="_blank">${imgTag}</a>` : imgTag;

        return `
          <div style="text-align: ${align}; margin: 15px 0;">
            ${content}
          </div>
        `;
      }

      case "button": {
        const align = block.align || "center";
        const bgColor = block.bgColor || "#0d9488";
        const textColor = block.textColor || "#ffffff";
        const borderRadius = block.borderRadius !== undefined ? block.borderRadius : 8;
        const fontSize = block.fontSize || 15;
        const py = block.paddingY || 12;
        const px = block.paddingX || 24;

        return `
          <div style="text-align: ${align}; margin: 20px 0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${block.url}" style="height:${py * 2 + fontSize}px;v-text-anchor:middle;width:200px;" arcsize="${borderRadius * 2}%" stroke="f" fillcolor="${bgColor}">
              <w:anchorlock/>
              <center style="color:${textColor};font-family:sans-serif;font-size:${fontSize}px;font-weight:bold;">${block.label}</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${block.url}" target="_blank" style="background-color: ${bgColor}; color: ${textColor}; display: inline-block; font-size: ${fontSize}px; font-weight: bold; text-decoration: none; padding: ${py}px ${px}px; border-radius: ${borderRadius}px; box-shadow: 0 4px 12px rgba(13,148,136,0.3); transition: all 0.2s ease;">
              ${block.label}
            </a>
            <!--<![endif]-->
          </div>
        `;
      }

      case "divider": {
        const color = block.color || "#334155";
        const thickness = block.thickness || 1;
        const margin = block.margin || 20;
        return `
          <hr style="border: 0; border-top: ${thickness}px solid ${color}; margin: ${margin}px 0;" />
        `;
      }

      case "columns": {
        const cols = block.columns || [];
        const widthPercent = Math.floor(100 / (block.count || 2));
        const renderedCols = cols
          .map(
            (colBlocks) => `
          <td class="column-td" width="${widthPercent}%" valign="top" style="padding: 10px;">
            ${colBlocks.map((b) => this.renderBlock(b)).join("\n")}
          </td>
        `
          )
          .join("\n");

        return `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 15px 0;">
            <tr>
              ${renderedCols}
            </tr>
          </table>
        `;
      }

      case "social": {
        const align = block.align || "center";
        const icons = (block.links || [])
          .map(
            (s) =>
              `<a href="${s.url}" target="_blank" style="display: inline-block; margin: 0 6px; color: #38bdf8; text-decoration: none; font-size: 13px; font-weight: bold;">[${s.platform.toUpperCase()}]</a>`
          )
          .join("");

        return `
          <div style="text-align: ${align}; margin: 20px 0;">
            ${icons}
          </div>
        `;
      }

      case "footer": {
        const textColor = block.textColor || "#64748b";
        const unsub = block.unsubscribeUrl
          ? `<br><a href="${block.unsubscribeUrl}" style="color: #38bdf8; text-decoration: underline;">Desuscribirme de esta lista</a>`
          : "";
        return `
          <div style="text-align: center; color: ${textColor}; font-size: 12px; margin-top: 30px; border-top: 1px solid #334155; padding-top: 15px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} ${block.companyName}. Todos los derechos reservados.</p>
            ${block.address ? `<p style="margin: 4px 0 0 0;">${block.address}</p>` : ""}
            ${unsub}
          </div>
        `;
      }

      default:
        return "";
    }
  }
}
