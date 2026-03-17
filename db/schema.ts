import { pgTable, text, timestamp, uuid, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums - must be defined before table usage
export const ticketTypeEnum = pgEnum("ticket_type", ["task", "research"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["inbox", "next", "active", "done", "archived"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: ticketTypeEnum().notNull().default("task"),
  status: ticketStatusEnum().notNull().default("inbox"),
  priority: integer("priority"),
  projectId: uuid("project_id").references(() => projects.id),
  assigneeId: uuid("assignee_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments table
export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Jots table (quick notes that can be promoted to tickets)
export const jots = pgTable("jots", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  authorId: uuid("author_id").notNull().references(() => users.id),
  promotedTo: uuid("promoted_to").references(() => tickets.id), // nullable - only set if promoted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inbox items table (user-specific prioritized inbox)
export const inboxItems = pgTable("inbox_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  targetUser: uuid("target_user").notNull().references(() => users.id),
  position: integer("position").notNull(), // for manual ordering
  triaged: boolean("triaged").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for better querying
export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  assignedTickets: many(tickets),
  comments: many(comments),
  jots: many(jots),
  inboxItems: many(inboxItems),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  project: one(projects, {
    fields: [tickets.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
  }),
  comments: many(comments),
  inboxItems: many(inboxItems),
  promotedFromJots: many(jots),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const jotsRelations = relations(jots, ({ one }) => ({
  author: one(users, {
    fields: [jots.authorId],
    references: [users.id],
  }),
  promotedToTicket: one(tickets, {
    fields: [jots.promotedTo],
    references: [tickets.id],
  }),
}));

export const inboxItemsRelations = relations(inboxItems, ({ one }) => ({
  ticket: one(tickets, {
    fields: [inboxItems.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [inboxItems.targetUser],
    references: [users.id],
  }),
}));
