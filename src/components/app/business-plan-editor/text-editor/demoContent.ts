import { Node } from "prosemirror-model";
import { schema } from "./schema";

/**
 * Document de démonstration au format JSON ProseMirror.
 * Peut être sérialisé/désérialisé avec `Node.toJSON()` / `Node.fromJSON()`.
 */
const DEMO_DOC = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Bienvenue dans l'éditeur WYSIWYG" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Cet éditeur est construit avec " },
        { type: "text", marks: [{ type: "strong" }], text: "ProseMirror" },
        { type: "text", text: ", " },
        { type: "text", marks: [{ type: "em" }], text: "Next.js" },
        { type: "text", text: " et " },
        { type: "text", marks: [{ type: "strong" }], text: "shadcn/ui" },
        {
          type: "text",
          text: ". Il supporte les fonctionnalités essentielles d'un éditeur de texte riche.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Mise en forme" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Vous pouvez rendre du texte " },
        { type: "text", marks: [{ type: "strong" }], text: "gras" },
        { type: "text", text: " avec Ctrl+B, ou en " },
        { type: "text", marks: [{ type: "em" }], text: "italique" },
        { type: "text", text: " avec Ctrl+I. Combinez les deux pour du " },
        {
          type: "text",
          marks: [{ type: "strong" }, { type: "em" }],
          text: "texte important",
        },
        { type: "text", text: "." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Listes à puces" }],
    },
    {
      type: "bullet_list",
      attrs: { listStyleType: "disc" },
      content: [
        {
          type: "list_item",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Premier élément de la liste" }] },
          ],
        },
        {
          type: "list_item",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Deuxième élément de la liste" }],
            },
          ],
        },
        {
          type: "list_item",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Troisième élément — avec du texte " },
                { type: "text", marks: [{ type: "em" }], text: "mis en valeur" },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Listes numérotées" }],
    },
    {
      type: "ordered_list",
      attrs: { order: 1, listStyleType: "decimal" },
      content: [
        {
          type: "list_item",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Installer les dépendances avec " },
                { type: "text", marks: [{ type: "strong" }], text: "pnpm install" },
              ],
            },
          ],
        },
        {
          type: "list_item",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Lancer le serveur de développement" }],
            },
          ],
        },
        {
          type: "list_item",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Ouvrir l'éditeur dans le navigateur" }],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Annulation / Rétablissement" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Utilisez Ctrl+Z pour annuler et Ctrl+Shift+Z pour rétablir. Les boutons dans la barre d'outils font la même chose.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Pagination automatique" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Les bandes grises fines entre les blocs sont des ",
        },
        { type: "text", marks: [{ type: "strong" }], text: "séparateurs de page automatiques" },
        {
          type: "text",
          text: ". Ils sont calculés en temps réel par le plugin de pagination. Aucun bloc n'est jamais coupé — s'il ne rentre pas dans l'espace restant, il passe entièrement à la page suivante.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Saut de page manuel" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Vous pouvez aussi forcer un saut de page avec le bouton ",
        },
        { type: "text", marks: [{ type: "strong" }], text: "⊟" },
        {
          type: "text",
          text: " dans la barre d'outils. Ce saut est permanent et apparaît dans le document JSON. Sélectionnez-le et appuyez sur Suppr pour le retirer.",
        },
      ],
    },
  ],
};

/**
 * Crée un nœud ProseMirror à partir du JSON de démonstration.
 * Compatible SSR — n'utilise pas le DOM.
 */
export function createDemoDoc(): Node {
  return Node.fromJSON(schema, DEMO_DOC);
}
