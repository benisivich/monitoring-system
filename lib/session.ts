export type Personnel = {
  id: number;
  username: string;
  displayName: string;
  email: string;
  phone: string;
  employeeId: string;
  notes: string;
};

type Session = {
  token: string;
  user: Personnel | null;
};

let session: Session = {
  token: "",
  user: null,
};

export function setSession(token: string, user: Personnel | null) {
  session = { token, user };
}

export function getSessionToken() {
  return session.token;
}

export function getSignedInUser() {
  return session.user?.displayName || session.user?.username || "";
}

export function getPersonnel() {
  return session.user;
}

export function setPersonnel(user: Personnel | null) {
  session = { ...session, user };
}

export function clearSignedInUser() {
  session = { token: "", user: null };
}

export function setSignedInUser(username: string) {
  session = {
    ...session,
    user: session.user
      ? { ...session.user, username, displayName: username }
      : {
          id: 0,
          username,
          displayName: username,
          email: "",
          phone: "",
          employeeId: "",
          notes: "",
        },
  };
}
