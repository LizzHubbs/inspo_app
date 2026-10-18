export interface Idea {
  id: string;
  ownerId: string;
  ownerUsername: string;
  text: string;
  status: "live" | "rejected" | "pending" | "deleted";
  createdAt: string;
}
