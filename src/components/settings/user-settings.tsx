import { useMutation, useQuery } from "convex/react";
import { KeyRoundIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ItemListSkeleton } from "@/components/item-list-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/errors";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type UserListItem = {
  _id: Id<"users">;
  name?: string;
  email?: string;
};

function formatUserLabel(user: UserListItem): string {
  if (user.name && user.email) {
    return `${user.name} (${user.email})`;
  }
  return user.name ?? user.email ?? "Utilisateur";
}

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const createUser = useMutation(api.users.create);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createUser({ name, email, password });
      toast.success(`Compte créé pour ${created.email}.`);
      resetForm();
      onOpenChange(false);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Créer un compte"
      description="Ajoutez un nouveau compte utilisateur. Il pourra se connecter avec ce courriel et ce mot de passe."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Créer le compte"
      pendingLabel="Création..."
      onClose={resetForm}
    >
      <FieldGroup>
        <Field data-invalid={error !== null}>
          <FieldLabel htmlFor="create-user-name">Nom</FieldLabel>
          <Input
            id="create-user-name"
            value={name}
            onChange={(event) => {
              setError(null);
              setName(event.target.value);
            }}
            required
          />
        </Field>
        <Field data-invalid={error !== null}>
          <FieldLabel htmlFor="create-user-email">Courriel</FieldLabel>
          <Input
            id="create-user-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setError(null);
              setEmail(event.target.value);
            }}
            required
          />
        </Field>
        <Field data-invalid={error !== null}>
          <FieldLabel htmlFor="create-user-password">Mot de passe</FieldLabel>
          <Input
            id="create-user-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setError(null);
              setPassword(event.target.value);
            }}
            minLength={6}
            required
          />
          {error !== null ? <FieldError>{error}</FieldError> : null}
        </Field>
      </FieldGroup>
    </FormDialog>
  );
}

type EditUserDialogProps = {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const updateUser = useMutation(api.users.update);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncedUserId, setSyncedUserId] = useState<Id<"users"> | null>(null);

  if (user !== null && user._id !== syncedUserId) {
    setSyncedUserId(user._id);
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (user === null) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await updateUser({ userId: user._id, name, email });
      toast.success(`Compte mis à jour pour ${name || email}.`);
      onOpenChange(false);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Modifier le compte"
      description="Modifiez le nom et le courriel de connexion."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Enregistrer"
      pendingLabel="Enregistrement..."
      onClose={() => setSyncedUserId(null)}
    >
      <FieldGroup>
        <Field data-invalid={error !== null}>
          <FieldLabel htmlFor="edit-user-name">Nom</FieldLabel>
          <Input
            id="edit-user-name"
            value={name}
            onChange={(event) => {
              setError(null);
              setName(event.target.value);
            }}
            required
          />
        </Field>
        <Field data-invalid={error !== null}>
          <FieldLabel htmlFor="edit-user-email">Courriel</FieldLabel>
          <Input
            id="edit-user-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setError(null);
              setEmail(event.target.value);
            }}
            required
          />
          {error !== null ? <FieldError>{error}</FieldError> : null}
        </Field>
      </FieldGroup>
    </FormDialog>
  );
}

type ChangePasswordDialogProps = {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ChangePasswordDialog({
  user,
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const changePassword = useMutation(api.users.changePassword);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setNewPassword("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (user === null) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await changePassword({ userId: user._id, newPassword });
      toast.success(`Mot de passe mis à jour pour ${formatUserLabel(user)}.`);
      resetForm();
      onOpenChange(false);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Changer le mot de passe"
      description={
        user !== null
          ? `Définissez un nouveau mot de passe pour ${formatUserLabel(user)}.`
          : null
      }
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Enregistrer"
      pendingLabel="Enregistrement..."
      onClose={resetForm}
    >
      <FieldGroup>
        <Field data-invalid={error !== null}>
          <FieldLabel htmlFor="new-password">Nouveau mot de passe</FieldLabel>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => {
              setError(null);
              setNewPassword(event.target.value);
            }}
            minLength={6}
            required
          />
          {error !== null ? <FieldError>{error}</FieldError> : null}
        </Field>
      </FieldGroup>
    </FormDialog>
  );
}

type DeleteUserDialogProps = {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps) {
  const removeUser = useMutation(api.users.remove);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    if (user === null) {
      return;
    }

    setIsDeleting(true);
    try {
      await removeUser({ userId: user._id });
      toast.success(`Compte supprimé : ${formatUserLabel(user)}.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Supprimer ce compte ?"
      description={
        user !== null
          ? `Le compte de ${formatUserLabel(user)} sera définitivement supprimé. Cette action est irréversible.`
          : null
      }
      isPending={isDeleting}
      onConfirm={() => void handleConfirm()}
    />
  );
}

export function UserSettings() {
  const viewer = useQuery(api.users.viewer);
  const users = useQuery(api.users.list);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogUser, setEditDialogUser] = useState<UserListItem | null>(
    null,
  );
  const [passwordDialogUser, setPasswordDialogUser] =
    useState<UserListItem | null>(null);
  const [deleteDialogUser, setDeleteDialogUser] = useState<UserListItem | null>(
    null,
  );

  if (users === undefined || viewer === undefined) {
    return <ItemListSkeleton />;
  }

  const userCountLabel =
    users.length === 1
      ? "1 compte utilisateur"
      : `${users.length} comptes utilisateurs`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{userCountLabel}</p>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon />
          Créer un compte
        </Button>
      </div>

      <ItemGroup>
        {users.map((user) => {
          const isCurrentUser = viewer?._id === user._id;

          return (
            <Item key={user._id} variant="outline">
              <ItemContent>
                <ItemTitle>
                  {user.name ?? user.email ?? "Utilisateur"}
                  {isCurrentUser ? <Badge variant="secondary">Vous</Badge> : null}
                </ItemTitle>
                {user.name && user.email ? (
                  <ItemDescription>{user.email}</ItemDescription>
                ) : null}
              </ItemContent>
              <ItemActions className="flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogUser(user)}
                >
                  <PencilIcon />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPasswordDialogUser(user)}
                >
                  <KeyRoundIcon />
                  Changer le mot de passe
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isCurrentUser}
                  title={
                    isCurrentUser
                      ? "Vous ne pouvez pas supprimer votre propre compte."
                      : undefined
                  }
                  onClick={() => setDeleteDialogUser(user)}
                >
                  <Trash2Icon />
                  Supprimer
                </Button>
              </ItemActions>
            </Item>
          );
        })}
      </ItemGroup>

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <EditUserDialog
        user={editDialogUser}
        open={editDialogUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialogUser(null);
          }
        }}
      />
      <ChangePasswordDialog
        user={passwordDialogUser}
        open={passwordDialogUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordDialogUser(null);
          }
        }}
      />
      <DeleteUserDialog
        user={deleteDialogUser}
        open={deleteDialogUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogUser(null);
          }
        }}
      />
    </div>
  );
}
