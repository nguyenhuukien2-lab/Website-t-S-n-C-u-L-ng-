USE [Vifon_Portal]
GO
/****** Object:  Table [dbo].[Menu]    Script Date: 22/04/2026 13:14:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Menu](
	[Id] [varchar](36) NOT NULL,
	[MenuTitle] [nvarchar](100) NULL,
	[MenuUrl] [varchar](100) NULL,
	[MenuPeriod] [int] NULL,
	[MenuType] [int] NULL,
	[ParentId] [varchar](36) NULL,
	[MenuIcon] [varchar](30) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Permision]    Script Date: 22/04/2026 13:14:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Permision](
	[Id] [varchar](36) NOT NULL,
	[PermisionName] [nvarchar](100) NOT NULL,
	[PermisionNote] [nvarchar](200) NULL,
	[Deleted] [bit] NULL,
	[CreatedDate] [datetime] NULL,
	[CreatedBy] [varchar](36) NULL,
	[MenuAssign] [varchar](36) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PermisionLines]    Script Date: 22/04/2026 13:14:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PermisionLines](
	[Id] [varchar](36) NOT NULL,
	[PermisionId] [varchar](36) NOT NULL,
	[Controller] [varchar](50) NULL,
	[Action] [varchar](100) NULL,
	[CreatedDate] [datetime] NULL,
	[CreatedBy] [varchar](36) NULL,
	[Deleted] [bit] NULL,
	[Note] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Role]    Script Date: 22/04/2026 13:14:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Role](
	[Id] [varchar](36) NOT NULL,
	[RoleName] [nvarchar](100) NOT NULL,
	[RoleNote] [nvarchar](200) NULL,
	[PermisionId] [varchar](36) NULL,
	[CreatedDate] [datetime] NULL,
	[CreatedBy] [varchar](36) NULL,
	[Deleted] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RolePermision]    Script Date: 22/04/2026 13:14:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RolePermision](
	[Id] [varchar](36) NOT NULL,
	[RoleId] [varchar](36) NOT NULL,
	[PermisionId] [varchar](36) NOT NULL,
	[Deleted] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserRole]    Script Date: 22/04/2026 13:14:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserRole](
	[Id] [varchar](36) NOT NULL,
	[UserId] [varchar](36) NULL,
	[RoleId] [varchar](36) NULL,
	[Deleted] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

-- =========================================================================
-- SEED DATA (MENU)
-- =========================================================================
INSERT [dbo].[Menu] ([Id], [MenuTitle], [MenuUrl], [MenuPeriod], [MenuType], [ParentId], [MenuIcon]) VALUES (N'027bc793-762f-4a14-b5f4-c7c9ab4843cc', N'Duyệt giải trình PDA', N'/ChamCongThiTruong/DuyetGiaiTrinhPDA', 90, 1, N'd2d9dbf0-bab1-42b9-9033-f1f8de697e4f', N'user-check')
GO
INSERT [dbo].[Menu] ([Id], [MenuTitle], [MenuUrl], [MenuPeriod], [MenuType], [ParentId], [MenuIcon]) VALUES (N'04aba9da-a94f-4076-9850-999ef1db0382', N'Quản lý cổ đông', N'#', 900, 1, NULL, N'users')
GO
INSERT [dbo].[Menu] ([Id], [MenuTitle], [MenuUrl], [MenuPeriod], [MenuType], [ParentId], [MenuIcon]) VALUES (N'05f3e01c-7c67-4eee-b530-bc12242fd24d', N'Danh sách NCC nhận email', N'/ReceiptInvoice/Venders', 90, 1, N'b61fb89b-6122-4d6d-afe7-8ebdba18750c', N'at-sign')
GO
INSERT [dbo].[Menu] ([Id], [MenuTitle], [MenuUrl], [MenuPeriod], [MenuType], [ParentId], [MenuIcon]) VALUES (N'27f3c78c-428b-4a4b-9102-a0416b0e3b92', N'Trang chủ', N'/', 9999, 1, NULL, N'home')
GO
INSERT [dbo].[Menu] ([Id], [MenuTitle], [MenuUrl], [MenuPeriod], [MenuType], [ParentId], [MenuIcon]) VALUES (N'df66d5aa-1a8c-4941-8fdf-dfda7a430c01', N'Đặt phòng họp', N'#', 100, 1, NULL, N'calendar')
GO
INSERT [dbo].[Menu] ([Id], [MenuTitle], [MenuUrl], [MenuPeriod], [MenuType], [ParentId], [MenuIcon]) VALUES (N'ea0d0fac-241b-4550-87d2-e424aceb4750', N'Đăng ký phòng họp', N'/BookResource/Index', 100, 1, N'df66d5aa-1a8c-4941-8fdf-dfda7a430c01', N'user-plus')
GO

-- =========================================================================
-- SEED DATA (PERMISION)
-- =========================================================================
INSERT [dbo].[Permision] ([Id], [PermisionName], [PermisionNote], [Deleted], [CreatedDate], [CreatedBy], [MenuAssign]) VALUES (N'0189e01d-c8ed-41bc-94ad-a5f0b4dcde16', N'Quản lý cổ đông - Danh sách cổ đông (Quyền tạo và update thông tin)', N'Quyền cập nhật thông tin cổ đông gồm thêm và sửa, khuyến nghị phân quyền cho bộ phận Pháp Chế', 0, CAST(N'2023-12-15T09:23:27.320' AS DateTime), N'43c3d921-6124-4d5f-ab91-6370cec1834f', NULL)
GO
INSERT [dbo].[Permision] ([Id], [PermisionName], [PermisionNote], [Deleted], [CreatedDate], [CreatedBy], [MenuAssign]) VALUES (N'6694a5e4-2486-43c2-9819-a35a94752a71', N'Trang chủ', N'Quyền được vào trang chủ', 0, CAST(N'2023-12-02T00:00:00.000' AS DateTime), NULL, NULL)
GO
INSERT [dbo].[Permision] ([Id], [PermisionName], [PermisionNote], [Deleted], [CreatedDate], [CreatedBy], [MenuAssign]) VALUES (N'4024a6ce-1f68-4a0c-8277-786c10fc85cb', N'Đặt phòng họp - Đăng ký phòng họp', N'Được phép vào chức năng đăng ký phòng họp', 0, CAST(N'2024-05-17T15:28:58.630' AS DateTime), N'36e95ee4-f6c2-4f91-9818-ae6fc477aee0', N'ea0d0fac-241b-4550-87d2-e424aceb4750')
GO

-- =========================================================================
-- SEED DATA (PERMISION LINES)
-- =========================================================================
INSERT [dbo].[PermisionLines] ([Id], [PermisionId], [Controller], [Action], [CreatedDate], [CreatedBy], [Deleted], [Note]) VALUES (N'02e60c29-f0bc-4a90-aa85-52631faf806c', N'6694a5e4-2486-43c2-9819-a35a94752a71', N'Home', N'_TopRightMenu', CAST(N'2023-12-04T16:52:47.857' AS DateTime), N'43c3d921-6124-4d5f-ab91-6370cec1834f', 0, N'Thanh menu trên trang chủ')
GO
INSERT [dbo].[PermisionLines] ([Id], [PermisionId], [Controller], [Action], [CreatedDate], [CreatedBy], [Deleted], [Note]) VALUES (N'04aa877f-d727-4a22-8239-535d0c380587', N'6694a5e4-2486-43c2-9819-a35a94752a71', N'Home', N'_LeftMenu', CAST(N'2023-12-04T16:52:47.870' AS DateTime), N'43c3d921-6124-4d5f-ab91-6370cec1834f', 0, N'Thanh menu trái trang chủ')
GO
INSERT [dbo].[PermisionLines] ([Id], [PermisionId], [Controller], [Action], [CreatedDate], [CreatedBy], [Deleted], [Note]) VALUES (N'7ea1e450-d549-4e2b-9aa0-f56767f84b37', N'6694a5e4-2486-43c2-9819-a35a94752a71', N'Home', N'Index', CAST(N'2023-12-02T00:00:00.000' AS DateTime), NULL, 0, N'Vào được trang chủ')
GO
