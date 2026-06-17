from django.test import TestCase

# Create your tests here.
"""
apps/projects/tests/test_projects.py
──────────────────────────────────────
Full test coverage for the projects app.

Layers tested
─────────────
test_models.py        — ORM, managers, model methods
test_serializers.py   — serializer validation
test_views.py         — HTTP integration tests (full request → response)
test_permissions.py   — permission class unit tests

All tests live in this single file for convenience during development.
Split into separate files once the suite grows beyond ~200 lines per section.
"""

# ════════════════════════════════════════════════════════════════════════════
# Imports & shared helpers
# ════════════════════════════════════════════════════════════════════════════

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User, Profile
from apps.projects.models import Project, ProjectMember


# ── factories ────────────────────────────────────────────────────────────

def make_user(email="user@example.com", password="Str0ngP@ss!", **kw) -> User:
    user = User.objects.create_user(email=email, first_name="Test", last_name="User",
                                    password=password, **kw)
    Profile.objects.get_or_create(user=user)
    return user


def auth_client(user: User) -> APIClient:
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


def make_project(owner: User, title="Test Project", **kw) -> Project:
    project = Project.objects.create(owner=owner, title=title, **kw)
    ProjectMember.objects.create(project=project, user=owner, role=ProjectMember.Role.OWNER)
    return project


def add_member(project: Project, user: User, role=ProjectMember.Role.MEMBER) -> ProjectMember:
    return ProjectMember.objects.create(project=project, user=user, role=role)


# ── URL helpers ───────────────────────────────────────────────────────────

PROJECTS_LIST_URL   = reverse("project-list")

def project_detail_url(pk):    return reverse("project-detail", args=[pk])
def invite_url(pk):            return reverse("project-invite", args=[pk])
def leave_url(pk):             return reverse("project-leave", args=[pk])
def members_list_url(pk):      return reverse("project-members-list", args=[pk])
def member_detail_url(pk, mid): return reverse("project-members-detail", args=[pk, mid])


# ════════════════════════════════════════════════════════════════════════════
# MODEL TESTS
# ════════════════════════════════════════════════════════════════════════════

from django.test import TestCase


class ProjectModelTest(TestCase):

    def setUp(self):
        self.owner = make_user()
        self.project = make_project(self.owner)

    def test_str_returns_title(self):
        self.assertEqual(str(self.project), "Test Project")

    def test_owner_has_owner_role_membership(self):
        role = self.project.get_member_role(self.owner)
        self.assertEqual(role, ProjectMember.Role.OWNER)

    def test_non_member_returns_none_role(self):
        stranger = make_user(email="stranger@example.com")
        self.assertIsNone(self.project.get_member_role(stranger))

    def test_owner_passes_is_admin_or_owner(self):
        self.assertTrue(self.project.is_admin_or_owner(self.owner))

    def test_admin_passes_is_admin_or_owner(self):
        admin = make_user(email="admin@example.com")
        add_member(self.project, admin, ProjectMember.Role.ADMIN)
        self.assertTrue(self.project.is_admin_or_owner(admin))

    def test_plain_member_fails_is_admin_or_owner(self):
        member = make_user(email="member@example.com")
        add_member(self.project, member)
        self.assertFalse(self.project.is_admin_or_owner(member))

    def test_for_user_manager_filters_correctly(self):
        other_owner = make_user(email="other@example.com")
        other_project = make_project(other_owner, title="Other")
        qs = Project.objects.for_user(self.owner)
        self.assertIn(self.project, qs)
        self.assertNotIn(other_project, qs)

    def test_duplicate_membership_raises(self):
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            ProjectMember.objects.create(project=self.project, user=self.owner, role="member")

    def test_project_member_str(self):
        pm = ProjectMember.objects.get(project=self.project, user=self.owner)
        self.assertIn(self.owner.email, str(pm))
        self.assertIn(self.project.title, str(pm))


# ════════════════════════════════════════════════════════════════════════════
# SERIALIZER TESTS
# ════════════════════════════════════════════════════════════════════════════

from django.test import RequestFactory
from projects.serializers import (
    InviteMemberSerializer,
    ProjectSerializer,
    ProjectUpdateSerializer,
    UpdateMemberRoleSerializer,
)


class InviteMemberSerializerTest(TestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.invitee = make_user(email="invitee@example.com")

    def _ctx(self):
        return {"project": self.project}

    def test_valid_invite(self):
        s = InviteMemberSerializer(
            data={"email": self.invitee.email, "role": "member"},
            context=self._ctx(),
        )
        self.assertTrue(s.is_valid(), s.errors)

    def test_unknown_email_invalid(self):
        s = InviteMemberSerializer(data={"email": "ghost@x.com"}, context=self._ctx())
        self.assertFalse(s.is_valid())
        self.assertIn("email", s.errors)

    def test_duplicate_invite_invalid(self):
        add_member(self.project, self.invitee)
        s = InviteMemberSerializer(
            data={"email": self.invitee.email}, context=self._ctx()
        )
        self.assertFalse(s.is_valid())

    def test_save_creates_membership(self):
        s = InviteMemberSerializer(
            data={"email": self.invitee.email, "role": "viewer"},
            context=self._ctx(),
        )
        s.is_valid(raise_exception=True)
        pm = s.save()
        self.assertEqual(pm.role, ProjectMember.Role.VIEWER)
        self.assertEqual(pm.user, self.invitee)


class UpdateMemberRoleSerializerTest(TestCase):

    def test_valid_role_change(self):
        owner   = make_user()
        project = make_project(owner)
        member  = make_user(email="m@example.com")
        pm      = add_member(project, member)
        s = UpdateMemberRoleSerializer(pm, data={"role": "admin"}, partial=True)
        self.assertTrue(s.is_valid(), s.errors)

    def test_cannot_assign_owner_role(self):
        owner   = make_user()
        project = make_project(owner)
        member  = make_user(email="m2@example.com")
        pm      = add_member(project, member)
        s = UpdateMemberRoleSerializer(pm, data={"role": "owner"}, partial=True)
        self.assertFalse(s.is_valid())
        self.assertIn("role", s.errors)


class ProjectUpdateSerializerTest(TestCase):

    def test_blank_title_invalid(self):
        owner   = make_user()
        project = make_project(owner)
        s = ProjectUpdateSerializer(project, data={"title": "   "}, partial=True)
        self.assertFalse(s.is_valid())
        self.assertIn("title", s.errors)

    def test_title_is_stripped(self):
        owner   = make_user()
        project = make_project(owner)
        s = ProjectUpdateSerializer(project, data={"title": "  Clean  "}, partial=True)
        self.assertTrue(s.is_valid(), s.errors)
        self.assertEqual(s.validated_data["title"], "Clean")


# ════════════════════════════════════════════════════════════════════════════
# VIEW / INTEGRATION TESTS
# ════════════════════════════════════════════════════════════════════════════

class ProjectListCreateTest(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.client = auth_client(self.user)

    def test_list_returns_only_own_projects(self):
        make_project(self.user, title="Mine")
        other = make_user(email="o@example.com")
        make_project(other, title="Not Mine")

        res = self.client.get(PROJECTS_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [p["title"] for p in res.data]
        self.assertIn("Mine", titles)
        self.assertNotIn("Not Mine", titles)

    def test_create_project_returns_201(self):
        res = self.client.post(PROJECTS_LIST_URL, {"title": "New Project"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_sets_owner(self):
        res = self.client.post(PROJECTS_LIST_URL, {"title": "Owned"})
        self.assertEqual(res.data["owner"]["email"], self.user.email)

    def test_create_auto_adds_owner_as_member(self):
        res = self.client.post(PROJECTS_LIST_URL, {"title": "Auto-member"})
        project = Project.objects.get(pk=res.data["id"])
        self.assertTrue(project.members.filter(pk=self.user.pk).exists())

    def test_create_owner_role_is_owner(self):
        res = self.client.post(PROJECTS_LIST_URL, {"title": "Role check"})
        project = Project.objects.get(pk=res.data["id"])
        pm = ProjectMember.objects.get(project=project, user=self.user)
        self.assertEqual(pm.role, ProjectMember.Role.OWNER)

    def test_unauthenticated_list_returns_401(self):
        res = self.client_class().get(PROJECTS_LIST_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_title_returns_400(self):
        res = self.client.post(PROJECTS_LIST_URL, {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class ProjectRetrieveTest(APITestCase):

    def setUp(self):
        self.owner  = make_user()
        self.project = make_project(self.owner)
        self.client = auth_client(self.owner)

    def test_retrieve_returns_200(self):
        res = self.client.get(project_detail_url(self.project.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_includes_members(self):
        res = self.client.get(project_detail_url(self.project.pk))
        self.assertIn("members", res.data)
        self.assertEqual(len(res.data["members"]), 1)

    def test_non_member_gets_404(self):
        stranger = make_user(email="s@example.com")
        client   = auth_client(stranger)
        res = client.get(project_detail_url(self.project.pk))
        # The project is not in the filtered queryset so DRF returns 404
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class ProjectUpdateTest(APITestCase):

    def setUp(self):
        self.owner  = make_user()
        self.project = make_project(self.owner)

    def test_owner_can_update(self):
        client = auth_client(self.owner)
        res = client.patch(project_detail_url(self.project.pk), {"title": "Updated"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.title, "Updated")

    def test_admin_can_update(self):
        admin = make_user(email="admin@example.com")
        add_member(self.project, admin, ProjectMember.Role.ADMIN)
        client = auth_client(admin)
        res = client.patch(project_detail_url(self.project.pk), {"title": "Admin Updated"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_plain_member_cannot_update(self):
        member = make_user(email="m@example.com")
        add_member(self.project, member)
        client = auth_client(member)
        res = client.patch(project_detail_url(self.project.pk), {"title": "Sneaky"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_put_method_not_allowed(self):
        client = auth_client(self.owner)
        res = client.put(project_detail_url(self.project.pk), {"title": "PUT"})
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class ProjectDeleteTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)

    def test_owner_can_delete(self):
        client = auth_client(self.owner)
        res = client.delete(project_detail_url(self.project.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(pk=self.project.pk).exists())

    def test_admin_cannot_delete(self):
        admin = make_user(email="a@example.com")
        add_member(self.project, admin, ProjectMember.Role.ADMIN)
        client = auth_client(admin)
        res = client.delete(project_detail_url(self.project.pk))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_cannot_delete(self):
        member = make_user(email="m@example.com")
        add_member(self.project, member)
        client = auth_client(member)
        res = client.delete(project_detail_url(self.project.pk))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class InviteMemberViewTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.invitee = make_user(email="invitee@example.com")

    def test_owner_can_invite(self):
        client = auth_client(self.owner)
        res = client.post(invite_url(self.project.pk), {"email": self.invitee.email})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_invite_creates_membership(self):
        client = auth_client(self.owner)
        client.post(invite_url(self.project.pk), {"email": self.invitee.email, "role": "viewer"})
        self.assertTrue(
            ProjectMember.objects.filter(project=self.project, user=self.invitee).exists()
        )

    def test_invite_unknown_email_returns_400(self):
        client = auth_client(self.owner)
        res = client.post(invite_url(self.project.pk), {"email": "ghost@x.com"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_invite_returns_400(self):
        add_member(self.project, self.invitee)
        client = auth_client(self.owner)
        res = client.post(invite_url(self.project.pk), {"email": self.invitee.email})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_plain_member_cannot_invite(self):
        member = make_user(email="m@example.com")
        add_member(self.project, member)
        client = auth_client(member)
        res = client.post(invite_url(self.project.pk), {"email": self.invitee.email})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class LeaveProjectViewTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)

    def test_member_can_leave(self):
        member = make_user(email="m@example.com")
        add_member(self.project, member)
        client = auth_client(member)
        res = client.post(leave_url(self.project.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            ProjectMember.objects.filter(project=self.project, user=member).exists()
        )

    def test_owner_cannot_leave(self):
        client = auth_client(self.owner)
        res = client.post(leave_url(self.project.pk))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class MemberViewSetTest(APITestCase):

    def setUp(self):
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.member  = make_user(email="m@example.com")
        self.pm      = add_member(self.project, self.member)

    def test_list_members(self):
        client = auth_client(self.owner)
        res = client.get(members_list_url(self.project.pk))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)  # owner + member

    def test_owner_can_change_role(self):
        client = auth_client(self.owner)
        res = client.patch(
            member_detail_url(self.project.pk, self.pm.pk),
            {"role": "admin"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.pm.refresh_from_db()
        self.assertEqual(self.pm.role, ProjectMember.Role.ADMIN)

    def test_cannot_change_owner_role(self):
        owner_pm = ProjectMember.objects.get(project=self.project, user=self.owner)
        client   = auth_client(self.owner)
        res = client.patch(
            member_detail_url(self.project.pk, owner_pm.pk),
            {"role": "member"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_remove_member(self):
        client = auth_client(self.owner)
        res = client.delete(member_detail_url(self.project.pk, self.pm.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ProjectMember.objects.filter(pk=self.pm.pk).exists())

    def test_cannot_remove_owner_member(self):
        owner_pm = ProjectMember.objects.get(project=self.project, user=self.owner)
        client   = auth_client(self.owner)
        res = client.delete(member_detail_url(self.project.pk, owner_pm.pk))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_plain_member_cannot_change_role(self):
        client  = auth_client(self.member)
        other   = make_user(email="o@example.com")
        other_pm = add_member(self.project, other)
        res = client.patch(
            member_detail_url(self.project.pk, other_pm.pk),
            {"role": "admin"},
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ════════════════════════════════════════════════════════════════════════════
# PERMISSION UNIT TESTS
# ════════════════════════════════════════════════════════════════════════════

from django.test import RequestFactory as DjangoRF
from apps.projects.permissions import (
    IsMember, IsAdminOrOwner, IsProjectOwner, IsMemberOrAdminOrOwner
)


class PermissionUnitTest(TestCase):

    def setUp(self):
        self.factory = DjangoRF()
        self.owner   = make_user()
        self.project = make_project(self.owner)
        self.admin   = make_user(email="admin@example.com")
        self.member  = make_user(email="member@example.com")
        self.viewer  = make_user(email="viewer@example.com")
        self.stranger = make_user(email="stranger@example.com")
        add_member(self.project, self.admin,  ProjectMember.Role.ADMIN)
        add_member(self.project, self.member, ProjectMember.Role.MEMBER)
        add_member(self.project, self.viewer, ProjectMember.Role.VIEWER)

    def _req(self, user, method="GET"):
        req = getattr(self.factory, method.lower())("/")
        req.user = user
        return req

    # IsMember
    def test_is_member_allows_member(self):
        self.assertTrue(IsMember().has_object_permission(self._req(self.member), None, self.project))

    def test_is_member_blocks_stranger(self):
        self.assertFalse(IsMember().has_object_permission(self._req(self.stranger), None, self.project))

    # IsAdminOrOwner
    def test_admin_or_owner_allows_safe_for_members(self):
        self.assertTrue(IsAdminOrOwner().has_object_permission(self._req(self.member, "GET"), None, self.project))

    def test_admin_or_owner_blocks_member_on_write(self):
        self.assertFalse(IsAdminOrOwner().has_object_permission(self._req(self.member, "PATCH"), None, self.project))

    def test_admin_or_owner_allows_admin_on_write(self):
        self.assertTrue(IsAdminOrOwner().has_object_permission(self._req(self.admin, "PATCH"), None, self.project))

    def test_admin_or_owner_allows_owner_on_write(self):
        self.assertTrue(IsAdminOrOwner().has_object_permission(self._req(self.owner, "DELETE"), None, self.project))

    # IsProjectOwner
    def test_project_owner_allows_owner(self):
        self.assertTrue(IsProjectOwner().has_object_permission(self._req(self.owner), None, self.project))

    def test_project_owner_blocks_admin(self):
        self.assertFalse(IsProjectOwner().has_object_permission(self._req(self.admin), None, self.project))

    # IsMemberOrAdminOrOwner
    def test_composite_stranger_always_blocked(self):
        for method in ("GET", "PATCH", "DELETE"):
            self.assertFalse(
                IsMemberOrAdminOrOwner().has_object_permission(
                    self._req(self.stranger, method), None, self.project
                )
            )