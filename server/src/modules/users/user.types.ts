export interface User {
  id: string;
  username: string;
}

// Returned by search — flags let the client show the right button
// (Add friend / Remove friend / Unblock) without a second round trip.
export interface UserWithRelation extends User {
  isFriend: boolean;
  isBlockedByMe: boolean;
}
